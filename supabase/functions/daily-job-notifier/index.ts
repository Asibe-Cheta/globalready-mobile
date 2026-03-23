import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ADZUNA_BASE = 'https://api.adzuna.com/v1/api/jobs';

const PROFILE_TO_ADZUNA: Record<string, string> = {
  'united kingdom': 'gb', 'uk': 'gb', 'england': 'gb',
  'germany': 'de', 'netherlands': 'nl', 'canada': 'ca',
  'australia': 'au', 'ireland': 'ie', 'united states': 'us',
  'usa': 'us', 'austria': 'at', 'switzerland': 'ch', 'new zealand': 'nz',
};

async function fetchTopJobs(country: string, searchTerms: string): Promise<any[]> {
  const params = new URLSearchParams({
    app_id: Deno.env.get('ADZUNA_APP_ID')!,
    app_key: Deno.env.get('ADZUNA_APP_KEY')!,
    results_per_page: '10',
    what: searchTerms,
  });
  const res = await fetch(`${ADZUNA_BASE}/${country}/search/1?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []).map((r: any) => ({
    id: `adzuna_${r.id}`,
    title: r.title,
    company: r.company?.display_name ?? 'Unknown',
    description: (r.description ?? '').replace(/<[^>]*>/g, '').slice(0, 400),
    apply_url: r.redirect_url,
  }));
}

async function getBestMatch(cvData: any, jobs: any[]): Promise<{ title: string; company: string; score: number } | null> {
  if (!jobs.length) return null;
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
  const skills = cvData?.skills?.slice(0, 5).join(', ') ?? '';
  const role = cvData?.experience?.[0]?.title ?? '';
  const jobList = jobs.slice(0, 8).map((j, i) => `[${i + 1}] ${j.title} at ${j.company}: ${j.description.slice(0, 150)}`).join('\n');

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Candidate: ${role}, skills: ${skills}.\nJobs:\n${jobList}\n\nReturn ONLY JSON: {"best_index": 0, "score": 85} — index of best matching job and fit score 0-100.`,
    }],
  });
  try {
    let text = (msg.content[0] as any).text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const { best_index, score } = JSON.parse(text);
    const job = jobs[best_index];
    return job ? { title: job.title, company: job.company, score } : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // This endpoint is called by cron — verify with service role key
    const authHeader = req.headers.get('Authorization') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!authHeader.includes(serviceKey)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get all users with push tokens who haven't been notified today
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('user_id, token')
      .eq('active', true);

    if (!tokens?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'No active tokens' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Filter out users already notified today
    const { data: notifiedToday } = await supabase
      .from('push_notifications_log')
      .select('user_id')
      .gte('sent_at', todayStart.toISOString());

    const notifiedSet = new Set((notifiedToday ?? []).map((n: any) => n.user_id));
    const pendingTokens = tokens.filter(t => !notifiedSet.has(t.user_id));

    if (!pendingTokens.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'All users already notified today' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const expoMessages: any[] = [];

    // Process up to 50 users per cron run to avoid timeout
    for (const { user_id, token } of pendingTokens.slice(0, 50)) {
      try {
        // Get user's latest CV
        const { data: cvRow } = await supabase
          .from('cvs')
          .select('cv_data')
          .eq('user_id', user_id)
          .in('payment_status', ['paid', 'completed'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!cvRow?.cv_data) continue;
        const cvData = cvRow.cv_data;

        // Get profile for country
        const { data: profile } = await supabase
          .from('profiles')
          .select('country')
          .eq('id', user_id)
          .maybeSingle();

        const adzunaCountry = PROFILE_TO_ADZUNA[profile?.country?.toLowerCase() ?? ''] ?? 'gb';
        const searchTerms = [
          cvData?.experience?.[0]?.title ?? '',
          ...(cvData?.skills?.slice(0, 2) ?? []),
        ].filter(Boolean).join(' ') || 'professional';

        const jobs = await fetchTopJobs(adzunaCountry, searchTerms);
        const best = await getBestMatch(cvData, jobs);

        if (!best || best.score < 60) continue;

        expoMessages.push({
          to: token,
          title: `${best.score}% match found`,
          body: `${best.title} at ${best.company}`,
          data: { screen: 'daily-matches' },
          sound: 'default',
          badge: 1,
        });

        // Log notification
        await supabase.from('push_notifications_log').insert({
          user_id,
          title: `${best.score}% match found`,
          body: `${best.title} at ${best.company}`,
          sent_at: new Date().toISOString(),
        });
      } catch (userErr) {
        console.error(`Error processing user ${user_id}:`, userErr);
      }
    }

    // Send all notifications via Expo Push API in batches of 100
    let sent = 0;
    for (let i = 0; i < expoMessages.length; i += 100) {
      const batch = expoMessages.slice(i, i + 100);
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(batch),
      });
      if (res.ok) sent += batch.length;
    }

    return new Response(
      JSON.stringify({ sent, total_eligible: pendingTokens.length }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error: any) {
    console.error('daily-job-notifier error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
