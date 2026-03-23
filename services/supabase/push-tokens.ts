import { supabase } from '@/lib/supabase';

export async function savePushToken(token: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('push_tokens').upsert(
    { user_id: user.id, token, active: true, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
}

export async function deactivatePushToken(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('push_tokens').update({ active: false }).eq('user_id', user.id);
}
