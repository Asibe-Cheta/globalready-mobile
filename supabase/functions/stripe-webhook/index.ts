import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_SECRET');

  if (!webhookSecret || !stripeSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY');
    return new Response('Missing secrets', { status: 500 });
  }

  const body = await req.text();
  const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  /**
   * Resolve a Supabase user_id from the given candidates.
   * Priority:
   *  1. user_id from Stripe metadata (most reliable — set by our checkout)
   *  2. supabase_user_id from Stripe metadata (legacy field name used by web team)
   *  3. Email from Stripe customer object (fallback when web team omits metadata)
   */
  async function resolveUserId(
    metaUserId: string | undefined | null,
    metaSupabaseUserId: string | undefined | null,
    customerId: string | null | undefined
  ): Promise<string | null> {
    // 1. Explicit user_id in metadata
    if (metaUserId) return metaUserId;

    // 2. Legacy field name
    if (metaSupabaseUserId) return metaSupabaseUserId;

    // 3. Email-based lookup via Stripe customer — paginate through ALL users
    if (customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer.deleted && customer.email) {
          const targetEmail = customer.email.toLowerCase();
          let page = 1;
          const perPage = 1000;
          while (true) {
            const { data: { users } } = await supabase.auth.admin.listUsers({ page, perPage });
            if (!users?.length) break;
            const match = users.find((u) => u.email?.toLowerCase() === targetEmail);
            if (match) {
              console.log(`Resolved user_id ${match.id} via email ${customer.email}`);
              return match.id;
            }
            if (users.length < perPage) break; // last page reached
            page++;
          }
          console.error(`No Supabase user found for email ${customer.email}`);
        }
      } catch (err: any) {
        console.error('Failed to resolve user by email:', err.message);
      }
    }

    return null;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const userId = await resolveUserId(
          session.metadata?.user_id,
          session.metadata?.supabase_user_id,
          session.customer as string | null
        );

        if (!userId) {
          console.error(
            'checkout.session.completed: could not resolve user_id — ' +
            'metadata missing and email lookup failed. Session:', session.id
          );
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        console.log(`Subscription activated for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const updateData = {
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        };

        // Try to find user by metadata first (both field name variants), then
        // fall back to the existing stripe_subscription_id row.
        const userId = subscription.metadata?.user_id || subscription.metadata?.supabase_user_id;

        if (userId) {
          await supabase
            .from('subscriptions')
            .upsert({ user_id: userId, ...updateData }, { onConflict: 'user_id' });
        } else {
          // No metadata — update by subscription ID (row must already exist)
          const { error } = await supabase
            .from('subscriptions')
            .update(updateData)
            .eq('stripe_subscription_id', subscription.id);
          if (error) {
            console.error('subscription.updated: failed to update by stripe_subscription_id:', error.message);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err.message);
    return new Response('Internal error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
