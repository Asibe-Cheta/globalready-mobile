import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADZUNA_BASE = 'https://api.adzuna.com/v1/api/jobs';
const REED_BASE = 'https://www.reed.co.uk/api/1.0/search';
const CACHE_TTL_SECONDS = 86400; // 24 hours

// ─── Reed helpers ─────────────────────────────────────────────────────────────

interface ReedJob {
  jobId: number;
  employerName: string;
  jobTitle: string;
  locationName: string;
  minimumSalary?: number;
  maximumSalary?: number;
  date: string;
  jobUrl: string;
  jobDescription?: string;
  contractType?: string;
  fullTime?: boolean;
  partTime?: boolean;
}

function formatReedSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1000 ? `£${Math.round(n / 1000)}k` : `£${Math.round(n)}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

function mapReedJobType(r: ReedJob): string {
  if (r.partTime) return 'Part-Time';
  if (r.contractType === 'Contract') return 'Contract';
  return 'Full-Time';
}

function mapReedJob(r: ReedJob) {
  return {
    id: `reed_${r.jobId}`,
    title: r.jobTitle,
    company: { display_name: r.employerName },
    location: { display_name: r.locationName, area: ['United Kingdom'] },
    category: { label: 'General' },
    description: (r.jobDescription ?? '').replace(/<[^>]*>/g, ' ').trim().slice(0, 2000),
    redirect_url: r.jobUrl,
    created: r.date,
    contract_time: r.fullTime ? 'full_time' : r.partTime ? 'part_time' : 'full_time',
    salary_min: r.minimumSalary,
    salary_max: r.maximumSalary,
    _source: 'reed',
    _visa_sponsorship: 'UNKNOWN',
  };
}

async function fetchReedJobs(
  apiKey: string,
  what: string | undefined,
  visaSponsorship: boolean,
  remote: boolean,
  resultsToTake: number,
): Promise<{ jobs: any[]; total: number }> {
  const keywords = [
    what?.trim(),
    visaSponsorship ? 'visa sponsorship' : '',
    remote ? 'remote' : '',
  ].filter(Boolean).join(' ') || undefined;

  const params = new URLSearchParams({ resultsToTake: String(resultsToTake) });
  if (keywords) params.set('keywords', keywords);

  const credentials = btoa(`${apiKey}:`);
  const res = await fetch(`${REED_BASE}?${params.toString()}`, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!res.ok) return { jobs: [], total: 0 };

  const data = await res.json();
  const results: ReedJob[] = data.results ?? [];
  return {
    jobs: results.map(mapReedJob),
    total: data.totalResults ?? results.length,
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const adzunaAppId = Deno.env.get('ADZUNA_APP_ID')!;
    const adzunaAppKey = Deno.env.get('ADZUNA_APP_KEY')!;
    const reedApiKey = Deno.env.get('REED_API_KEY'); // optional — graceful degradation

    const { country = 'gb', what, visaSponsorship, remote, page = 1, resultsPerPage = 20 } = await req.json();

    // Build cache key from all params
    const cacheKey = [country, what ?? '', visaSponsorship ? '1' : '0', remote ? '1' : '0', page, resultsPerPage].join('_');

    // Check cache
    const { data: cached } = await supabase
      .from('job_search_cache')
      .select('results, total')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return new Response(
        JSON.stringify({ jobs: cached.results, total: cached.total, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build Adzuna search terms
    const terms: string[] = [];
    if (what?.trim()) terms.push(what.trim());
    if (visaSponsorship) terms.push('visa sponsorship');
    if (remote) terms.push('remote');

    const adzunaParams = new URLSearchParams({
      app_id: adzunaAppId,
      app_key: adzunaAppKey,
      results_per_page: String(resultsPerPage),
    });
    if (terms.length) adzunaParams.set('what', terms.join(' '));

    // Fetch Adzuna + Reed (UK only) in parallel
    const [adzunaRes, reedResult] = await Promise.all([
      fetch(`${ADZUNA_BASE}/${country}/search/${page}?${adzunaParams.toString()}`),
      country === 'gb' && reedApiKey
        ? fetchReedJobs(reedApiKey, what, visaSponsorship ?? false, remote ?? false, resultsPerPage)
        : Promise.resolve({ jobs: [], total: 0 }),
    ]);

    if (!adzunaRes.ok && reedResult.jobs.length === 0) {
      // Return empty result instead of propagating the error status — client falls back to supplement sources
      return new Response(
        JSON.stringify({ jobs: [], total: 0, adzunaFailed: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adzunaData = adzunaRes.ok ? await adzunaRes.json() : { results: [], count: 0 };
    const adzunaJobs = adzunaData.results ?? [];
    const adzunaTotal = adzunaData.count ?? 0;

    // Merge Adzuna + Reed, dedupe by title+company
    const seen = new Set<string>();
    const mergedJobs: any[] = [];
    for (const job of [...adzunaJobs, ...reedResult.jobs]) {
      const key = `${(job.title ?? '').toLowerCase().trim()}-${(job.company?.display_name ?? '').toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        mergedJobs.push(job);
      }
    }
    const total = adzunaTotal + reedResult.total;

    // Store in cache
    const expiresAt = new Date(Date.now() + CACHE_TTL_SECONDS * 1000).toISOString();
    await supabase.from('job_search_cache').upsert({
      cache_key: cacheKey,
      results: mergedJobs,
      total,
      cached_at: new Date().toISOString(),
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' });

    return new Response(
      JSON.stringify({ jobs: mergedJobs, total, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('fetch-jobs error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
