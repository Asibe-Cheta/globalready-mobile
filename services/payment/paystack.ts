import { supabase, supabaseAnonKey, supabaseUrl } from '@/lib/supabase';

export const initializePayment = async (email: string, amount: number, cvId: string) => {
  const reference = `GR-${Date.now()}`;

  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      cv_id: cvId,
      amount,
      reference,
      payment_method: 'paystack',
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  return { reference, paymentId: payment.id, email, amount };
};

export const verifyPayment = async (reference: string) => {
  const response = await fetch(`${supabaseUrl}/functions/v1/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({ reference }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Payment verification failed (${response.status})`);
  }

  const data = JSON.parse(text);

  await supabase.from('payments').update({ status: 'successful' }).eq('reference', reference);

  return data;
};
