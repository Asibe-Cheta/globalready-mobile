import { supabase, supabaseAnonKey, supabaseUrl } from '@/lib/supabase';

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentId: string;
  paymentIntentId: string;
  customerId: string;
  ephemeralKey: string;
}

export const initializeStripePayment = async (
  email: string,
  amount: number, // 500 for $5
  cvId: string
): Promise<PaymentIntentResponse> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({
      amount,
      cvId,
      userId: user.id,
      email: email || user.email,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    const urlNote = supabaseUrl ? ` (supabaseUrl: ${supabaseUrl})` : '';
    throw new Error((text || `Edge function error (${response.status})`) + urlNote);
  }

  return JSON.parse(text) as PaymentIntentResponse;
};

export const verifyStripePayment = async (reference: string) => {
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

  // Update payment status
  await supabase
    .from('payments')
    .update({ status: 'successful' })
    .eq('reference', reference);

  return data;
};
