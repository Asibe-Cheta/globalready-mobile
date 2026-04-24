import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-reconcile-secret',
};

type EmailToUserId = Record<string, string>;

function getUserIdFromMetadata(
  metadata: Record<string, string> | null | undefined
): string | null {
  if (!metadata) return null;
  return (
    metadata.user_id ||
    metadata.userId ||
    metadata.uid ||
    metadata.supabase_user_id ||
    metadata.supabaseUserId ||
    null
  );
}

async function buildEmailToUserIdMap(supabase: ReturnType<typeof createClient>): Promise<EmailToUserId> {
  const map: EmailToUserId = {};
  let page = 1;
  const perPage = 1000;

  while (true) {
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    if (!users?.length) break;

    for (const user of users) {
      const email = user.email?.toLowerCase();
      if (email) map[email] = user.id;
    }

    if (users.length < perPage) break;
    page++;
  }

  return map;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const reconcileSecret = Deno.env.get('RECONCILE_SECRET');
    const providedSecret = req.headers.get('x-reconcile-secret');
    if (!reconcileSecret || providedSecret !== reconcileSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_SECRET');
    if (!stripeSecret) {
      return new Response(JSON.stringify({ error: 'Missing Stripe secret' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });

    const emailToUserId = await buildEmailToUserIdMap(supabase);

    let startingAfter: string | undefined;
    let processed = 0;
    let upserted = 0;
    let proEligible = 0;
    let unmatched = 0;
    const unmatchedSamples: Array<{
      subscription_id: string;
      customer_id: string | null;
      email: string | null;
      status: string;
    }> = [];

    while (true) {
      const page = await stripe.subscriptions.list({
        status: 'all',
        limit: 100,
        starting_after: startingAfter,
        expand: ['data.customer'],
      });

      for (const sub of page.data) {
        processed++;

        const customer = typeof sub.customer === 'string' ? null : sub.customer;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null;
        const customerEmail = customer && !customer.deleted ? customer.email?.toLowerCase() ?? null : null;

        const metadataUserId = getUserIdFromMetadata(sub.metadata);
        const customerMetadataUserId =
          customer && !customer.deleted ? getUserIdFromMetadata(customer.metadata as Record<string, string>) : null;

        const userId = metadataUserId || customerMetadataUserId || (customerEmail ? emailToUserId[customerEmail] : null);

        if (!userId) {
          unmatched++;
          if (unmatchedSamples.length < 100) {
            unmatchedSamples.push({
              subscription_id: sub.id,
              customer_id: customerId,
              email: customerEmail,
              status: sub.status,
            });
          }
          continue;
        }

        const currentPeriodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;

        const { error } = await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            status: sub.status,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        if (error) {
          console.error(`Upsert failed for subscription ${sub.id}:`, error.message);
          continue;
        }

        upserted++;
        const isPro =
          (sub.status === 'active' || sub.status === 'trialing') &&
          !!currentPeriodEnd &&
          new Date(currentPeriodEnd) > new Date();
        if (isPro) proEligible++;
      }

      if (!page.has_more) break;
      startingAfter = page.data[page.data.length - 1]?.id;
      if (!startingAfter) break;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        processed,
        upserted,
        pro_eligible: proEligible,
        unmatched,
        unmatched_samples: unmatchedSamples,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('reconcile-subscriptions error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
