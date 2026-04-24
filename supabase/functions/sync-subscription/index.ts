import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
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

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prefer known customer ID from DB, fallback to Stripe email lookup.
    const { data: subRow } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId: string | null = subRow?.stripe_customer_id ?? null;
    if (!customerId && user.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 10,
      });
      customerId = customers.data.find((c) => !c.deleted)?.id ?? null;
    }

    if (!customerId) {
      return new Response(
        JSON.stringify({ synced: false, reason: 'no_customer_found', isPro: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 20,
    });

    const latest = subscriptions.data.sort((a, b) => b.created - a.created)[0];
    if (!latest) {
      return new Response(
        JSON.stringify({ synced: false, reason: 'no_subscription_found', isPro: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentPeriodEnd = latest.current_period_end
      ? new Date(latest.current_period_end * 1000).toISOString()
      : null;

    await supabase.from('subscriptions').upsert(
      {
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: latest.id,
        status: latest.status,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: latest.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    const isPro =
      (latest.status === 'active' || latest.status === 'trialing') &&
      (!!currentPeriodEnd && new Date(currentPeriodEnd) > new Date());

    return new Response(
      JSON.stringify({
        synced: true,
        status: latest.status,
        current_period_end: currentPeriodEnd,
        isPro,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('sync-subscription error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
