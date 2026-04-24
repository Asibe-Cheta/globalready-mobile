import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-audit-secret',
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const auditSecret = Deno.env.get('AUDIT_SECRET');
    const providedSecret = req.headers.get('x-audit-secret');
    if (!auditSecret || providedSecret !== auditSecret) {
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

    // 1) Build active Stripe user set
    const stripeActiveUserIds = new Set<string>();
    const unmatchedStripeActive: Array<{
      subscription_id: string;
      customer_id: string | null;
      email: string | null;
      status: string;
    }> = [];
    let stripeActiveCount = 0;

    let startingAfter: string | undefined;
    while (true) {
      const page = await stripe.subscriptions.list({
        status: 'all',
        limit: 100,
        starting_after: startingAfter,
        expand: ['data.customer'],
      });

      for (const sub of page.data) {
        if (sub.status !== 'active' && sub.status !== 'trialing') continue;
        stripeActiveCount++;

        const customer = typeof sub.customer === 'string' ? null : sub.customer;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null;
        const customerEmail = customer && !customer.deleted ? customer.email?.toLowerCase() ?? null : null;

        const metadataUserId = getUserIdFromMetadata(sub.metadata);
        const customerMetadataUserId =
          customer && !customer.deleted ? getUserIdFromMetadata(customer.metadata as Record<string, string>) : null;

        const userId = metadataUserId || customerMetadataUserId || (customerEmail ? emailToUserId[customerEmail] : null);
        if (userId) {
          stripeActiveUserIds.add(userId);
        } else if (unmatchedStripeActive.length < 100) {
          unmatchedStripeActive.push({
            subscription_id: sub.id,
            customer_id: customerId,
            email: customerEmail,
            status: sub.status,
          });
        }
      }

      if (!page.has_more) break;
      startingAfter = page.data[page.data.length - 1]?.id;
      if (!startingAfter) break;
    }

    // 2) Build DB pro set
    const nowIso = new Date().toISOString();
    const { data: dbSubs, error: dbError } = await supabase
      .from('subscriptions')
      .select('user_id,status,current_period_end,stripe_subscription_id,updated_at')
      .in('status', ['active', 'trialing'])
      .gt('current_period_end', nowIso);
    if (dbError) throw dbError;

    const dbProUserIds = new Set<string>((dbSubs ?? []).map((r: any) => r.user_id));

    const inStripeNotInDb: string[] = [];
    for (const id of stripeActiveUserIds) {
      if (!dbProUserIds.has(id)) inStripeNotInDb.push(id);
    }

    const inDbNotInStripe: Array<{
      user_id: string;
      status: string;
      current_period_end: string;
      stripe_subscription_id: string | null;
      updated_at: string;
    }> = [];
    for (const row of dbSubs ?? []) {
      if (!stripeActiveUserIds.has(row.user_id)) {
        inDbNotInStripe.push(row);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        summary: {
          stripe_active_subscriptions: stripeActiveCount,
          stripe_active_users_mapped: stripeActiveUserIds.size,
          db_pro_users: dbProUserIds.size,
          in_stripe_not_in_db_count: inStripeNotInDb.length,
          in_db_not_in_stripe_count: inDbNotInStripe.length,
          unmatched_stripe_active_count: unmatchedStripeActive.length,
        },
        samples: {
          in_stripe_not_in_db_user_ids: inStripeNotInDb.slice(0, 100),
          in_db_not_in_stripe: inDbNotInStripe.slice(0, 100),
          unmatched_stripe_active: unmatchedStripeActive,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('subscription-audit error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
