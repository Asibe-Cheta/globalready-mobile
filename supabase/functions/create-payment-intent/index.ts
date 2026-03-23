import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const getStripeSecret = () =>
  Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_SECRET');

const DEBUG_VERSION = '2026-02-03-1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  let stripeSecret: string | undefined;
  try {
    stripeSecret = getStripeSecret();
    if (!stripeSecret) {
      return new Response(
        JSON.stringify({
          error: 'Missing STRIPE_SECRET_KEY in function secrets',
          debug_version: DEBUG_VERSION,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: '2023-10-16',
    });

    const { amount, cvId, userId, email } = await req.json();

    // Validate inputs
    if (!amount || !cvId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Reuse or create Stripe customer for saved cards
    let customerId: string | null = null;
    if (email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      customerId = existing.data[0]?.id || null;
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { user_id: userId },
      });
      customerId = customer.id;
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // 500 for $5
      currency: 'usd',
      customer: customerId,
      setup_future_usage: 'off_session',
      metadata: {
        cv_id: cvId,
        user_id: userId,
        service: 'cv_tailoring',
      },
      receipt_email: email,
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' }
    );

    // Store payment record in Supabase
    const { data: payment, error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        cv_id: cvId,
        amount: amount,
        currency: 'USD',
        payment_method: 'stripe',
        reference: paymentIntent.id,
        status: 'pending',
        metadata: { 
          client_secret: paymentIntent.client_secret 
        },
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id,
        paymentIntentId: paymentIntent.id,
        customerId,
        ephemeralKey: ephemeralKey.secret,
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Payment intent error:', error);
    if (error?.message?.includes?.('API key')) {
      return new Response(
        JSON.stringify({
          error: 'Stripe auth failed',
          details: error.message,
          stripe_key_present: Boolean(stripeSecret),
          stripe_key_length: stripeSecret?.length || 0,
          debug_version: DEBUG_VERSION,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
