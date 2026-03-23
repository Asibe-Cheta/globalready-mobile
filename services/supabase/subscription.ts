import { supabase } from '@/lib/supabase';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'active' | 'canceled' | 'past_due' | 'inactive';
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Subscription;
}

export function isProActive(sub: Subscription | null): boolean {
  if (!sub) return false;
  if (sub.status !== 'active') return false;
  if (!sub.current_period_end) return false;
  return new Date(sub.current_period_end) > new Date();
}
