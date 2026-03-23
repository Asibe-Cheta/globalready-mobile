import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ADZUNA_BASE = 'https://api.adzuna.com/v1/api/jobs';

const COUNTRY_LABEL_MAP: Record<string, string> = {
  gb: 'United Kingdom', de: 'Germany', nl: 'Netherlands',
  ca: 'Canada', au: 'Australia', ie: 'Ireland',
  us: 'United States', at: 'Austria', ch: 'Switzerland', nz: 'New Zealand',
};

// Map profile country name → Adzuna country code
const PROFILE_TO_ADZUNA: Record<string, string> = {
  'united kingdom': 'gb', 'uk': 'gb', 'england': 'gb',
  'germany': 'de', 'deutschland': 'de',
  'netherlands': 'nl', 'holland': 'nl',
  'canada': 'ca', 'australia': 'au', 'ireland': 'ie',
  'united states': 'us', 'usa': 'us', 'america': 'us',
  'austria': 'at', 'switzerland': 'ch', 'new zealand': 'nz',
};

async function fetchAdzunaJobs(country: string, searchTerms: string): Promise<any[]> {
  const appId = Deno.env.get('ADZUNA_APP_ID');
  const appKey = Deno.env.get('ADZUNA_APP_KEY');

  const params = new URLSearchParams({
    app_id: appId!,
    app_key: appKey!,
    results_per_page: '20',
    what: searchTerms,
  });

  const url = `${ADZUNA_BASE}/${country}/search/1?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []).map((r: any) => ({
    id: `adzuna_${r.id}`,
    title: r.title,
    company: r.company?.display_name ?? 'Unknown',
    location: r.location?.display_name ?? '',
    description: (r.description ?? '').replace(/<[^>]*>/g, '').trim().slice(0, 500),
    salary_min: r.salary_min,
    salary_max: r.salary_max,
    contract_time: r.contract_time,
    category: r.category?.label ?? '',
    apply_url: r.redirect_url,
    country: COUNTRY_LABEL_MAP[country] ?? country.toUpperCase(),
    posted_date: r.created,
  }));
}

function buildSearchTerms(cvData: any): string {
  const terms: string[] = [];
  if (cvData?.experience?.length > 0) {
    const latest = cvData.experience[0];
    if (latest.title) terms.push(latest.title);
  }
  if (cvData?.skills?.length > 0) {
    terms.push(...cvData.skills.slice(0, 3));
  }
  return terms.slice(0, 4).join(' ') || 'professional';
}

function cvSummaryForPrompt(cvData: any): string {
  const parts: string[] = [];
  if (cvData?.personal?.fullName) parts.push(`Name: ${cvData.personal.fullName}`);
  if (cvData?.summary) parts.push(`Summary: ${cvData.summary}`);
  if (cvData?.skills?.length) parts.push(`Skills: ${cvData.skills.join(', ')}`);
  if (cvData?.experience?.length) {
    parts.push('Experience:');
    cvData.experience.slice(0, 3).forEach((e: any) => {
      parts.push(`  - ${e.title} at ${e.company}${e.achievements?.length ? ': ' + e.achievements.slice(0, 2).join('; ') : ''}`);
    });
  }
  if (cvData?.education?.length) {
    const edu = cvData.education[0];
    parts.push(`Education: ${edu.degree} from ${edu.school}`);
  }
  if (cvData?.languages?.length) {
    parts.push(`Languages: ${cvData.languages.map((l: any) => `${l.name} (${l.proficiency})`).join(', ')}`);
  }
  return parts.join('\n');
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Check daily generation limit (Free: 1/day, Pro: 3/day)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .single();

    const isPro = subscription?.status === 'active' &&
      new Date(subscription.current_period_end) > new Date();
    const dailyLimit = isPro ? 3 : 1;

    const { count: todayCount } = await supabase
      .from('job_matches')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('generated_at', todayStart.toISOString());

    if ((todayCount ?? 0) > 0 && !req.url.includes('force=true')) {
      // Return cached matches from today
      const { data: cached } = await supabase
        .from('job_matches')
        .select('*')
        .eq('user_id', user.id)
        .gte('generated_at', todayStart.toISOString())
        .order('fit_score', { ascending: false });

      return new Response(
        JSON.stringify({ matches: cached, cached: true, generations_used: todayCount, daily_limit: dailyLimit }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Count how many times generated today for limit check
    const generationsToday = todayCount ?? 0;
    if (generationsToday >= dailyLimit) {
      return new Response(
        JSON.stringify({ error: 'daily_limit_reached', daily_limit: dailyLimit, isPro }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Get user's latest paid CV
    const { data: cvRow } = await supabase
      .from('cvs')
      .select('cv_data, raw_text')
      .eq('user_id', user.id)
      .in('payment_status', ['paid', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cvRow) {
      return new Response(
        JSON.stringify({ error: 'no_cv', message: 'Build and download your CV first to use AI matching.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const cvData = cvRow.cv_data;

    // Get user profile for country preference
    const { data: profile } = await supabase
      .from('profiles')
      .select('country')
      .eq('id', user.id)
      .maybeSingle();

    const profileCountry = profile?.country?.toLowerCase() ?? '';
    const adzunaCountry = PROFILE_TO_ADZUNA[profileCountry] ?? 'gb';

    // Fetch jobs from Adzuna
    const searchTerms = buildSearchTerms(cvData);
    const jobs = await fetchAdzunaJobs(adzunaCountry, searchTerms);

    if (jobs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'no_jobs', message: 'Could not fetch jobs. Try again later.' }),
        { status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const cvSummary = cvSummaryForPrompt(cvData);
    const candidateName = cvData?.personal?.fullName ?? 'the candidate';
    const matchCount = isPro ? 5 : 3;

    const jobListText = jobs.map((j, i) =>
      `[${i + 1}] ID: ${j.id}\nTitle: ${j.title}\nCompany: ${j.company}\nLocation: ${j.location}\nCategory: ${j.category}\nDescription: ${j.description}`
    ).join('\n\n---\n\n');

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const prompt = `You are an expert career coach and recruiter. Analyze this candidate's CV against ${jobs.length} job listings and identify the ${matchCount} best matches.

CANDIDATE CV:
${cvSummary}

JOB LISTINGS:
${jobListText}

TASK:
1. Score each job 0-100 based on how well the candidate's skills and experience match the role
2. Pick the TOP ${matchCount} highest-scoring jobs
3. For each, write a short, genuine cover letter (150-200 words) personalized to the candidate's actual experience
4. Identify 2-3 specific match reasons and 1-2 honest skill gaps

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "matches": [
    {
      "job_id": "adzuna_xxx",
      "fit_score": 85,
      "match_reasons": ["Your 4 years of React experience directly aligns", "TypeScript expertise matches their stack"],
      "gaps": ["AWS certification mentioned as preferred"],
      "cover_letter": "Dear Hiring Team,\\n\\nI am excited to apply for the [Job Title] position at [Company]...\\n\\nYours sincerely,\\n${candidateName}"
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    let rawText = (message.content[0] as any).text.trim();
    rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const result = JSON.parse(rawText);

    // Enrich matches with full job data and save to DB
    const now = new Date().toISOString();
    const enrichedMatches = (result.matches ?? []).map((m: any) => {
      const jobData = jobs.find(j => j.id === m.job_id);
      return { ...m, job_data: jobData };
    }).filter((m: any) => m.job_data);

    const rowsToInsert = enrichedMatches.map((m: any) => ({
      user_id: user.id,
      job_id: m.job_id,
      job_data: m.job_data,
      fit_score: m.fit_score,
      match_reasons: m.match_reasons,
      gaps: m.gaps,
      cover_letter: m.cover_letter,
      status: 'new',
      generated_at: now,
    }));

    const { data: savedMatches } = await supabase
      .from('job_matches')
      .insert(rowsToInsert)
      .select();

    return new Response(
      JSON.stringify({
        matches: savedMatches ?? enrichedMatches,
        cached: false,
        generations_used: generationsToday + 1,
        daily_limit: dailyLimit,
        isPro,
      }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error: any) {
    console.error('ai-job-matcher error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
