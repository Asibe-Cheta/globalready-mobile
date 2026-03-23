import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return new Response(
        JSON.stringify({ error: 'Missing payment reference' }),
        { status: 400 }
      );
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(reference);

    if (paymentIntent.status !== 'succeeded') {
      return new Response(
        JSON.stringify({ 
          verified: false,
          status: paymentIntent.status 
        }),
        { 
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Update payment status in Supabase
    const { data: payment, error: dbError } = await supabase
      .from('payments')
      .update({ 
        status: 'successful',
        metadata: { 
          payment_intent_id: paymentIntent.id,
          verified_at: new Date().toISOString()
        },
      })
      .eq('reference', reference)
      .select()
      .single();

    if (dbError) throw dbError;

    // Update CV payment status if payment is successful
    if (payment?.cv_id) {
      await supabase
        .from('cvs')
        .update({ payment_status: 'completed' })
        .eq('id', payment.cv_id);
    }

    return new Response(
      JSON.stringify({
        verified: true,
        paymentId: payment.id,
        paymentIntentId: paymentIntent.id,
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Payment verification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
