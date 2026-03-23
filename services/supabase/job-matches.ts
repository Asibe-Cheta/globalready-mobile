import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

export interface JobMatch {
  id: string;
  user_id: string;
  job_id: string;
  job_data: {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    apply_url: string;
    country: string;
    posted_date: string;
    salary_min?: number;
    salary_max?: number;
    category?: string;
  };
  fit_score: number;
  match_reasons: string[];
  gaps: string[];
  cover_letter: string;
  status: 'new' | 'applied' | 'skipped';
  generated_at: string;
  applied_at?: string;
}

export interface MatcherResult {
  matches: JobMatch[];
  cached: boolean;
  generations_used: number;
  daily_limit: number;
  isPro: boolean;
}

export const jobMatchesService = {
  findMatches: async (force = false): Promise<MatcherResult> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const url = `${supabaseUrl}/functions/v1/ai-job-matcher${force ? '?force=true' : ''}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Failed to find matches');
    return data as MatcherResult;
  },

  getTodayMatches: async (): Promise<JobMatch[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('job_matches')
      .select('*')
      .eq('user_id', user.id)
      .gte('generated_at', todayStart.toISOString())
      .order('fit_score', { ascending: false });

    return (data ?? []) as JobMatch[];
  },

  /** Jobs the user has marked as applied (from Daily Matches). */
  getAppliedMatches: async (): Promise<JobMatch[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('job_matches')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'applied')
      .order('applied_at', { ascending: false });

    return (data ?? []) as JobMatch[];
  },

  updateStatus: async (matchId: string, status: 'applied' | 'skipped') => {
    const update: any = { status };
    if (status === 'applied') update.applied_at = new Date().toISOString();
    const { error } = await supabase
      .from('job_matches')
      .update(update)
      .eq('id', matchId);
    if (error) throw error;
  },
};
