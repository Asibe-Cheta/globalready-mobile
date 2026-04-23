import { supabase } from '@/lib/supabase';
import { Job } from '@/types/job';
import { fetchAdzunaJobs, AdzunaFilters } from '@/services/adzuna';
import { fetchRemoteOKJobs } from '@/services/remoteok';
import { fetchRemotiveJobs } from '@/services/remotive';
import { fetchJobicyJobs } from '@/services/jobicy';
import { fetchWWRJobsAll } from '@/services/weworkremotely';
import { fetchArbeitnowJobs, fetchArbeitnowJobsForCountry } from '@/services/arbeitnow';

export interface JobFilters {
  country?: string;
  sector?: string;       // Adzuna slug e.g. 'it-jobs'
  visaSponsorship?: boolean;
  remote?: boolean;
  searchQuery?: string;  // user text query only
  globalRemote?: boolean;
}

// Keywords used to match free-source jobs to each sector slug
const SECTOR_KEYWORDS: Record<string, string[]> = {
  'it-jobs': ['software', 'developer', 'engineer', 'engineering', 'tech', 'data', 'cloud', 'devops', 'frontend', 'backend', 'fullstack', 'programming', 'IT', 'SRE', 'QA', 'machine learning', 'AI'],
  'healthcare-nursing-jobs': ['health', 'nurse', 'nursing', 'medical', 'clinical', 'hospital', 'care', 'doctor', 'physician', 'pharmacy', 'dental', 'therapist'],
  'accounting-finance-jobs': ['finance', 'financial', 'accounting', 'accountant', 'analyst', 'banking', 'investment', 'tax', 'audit', 'CFO', 'controller', 'payroll'],
  'engineering-jobs': ['engineer', 'engineering', 'mechanical', 'electrical', 'civil', 'manufacturing', 'industrial', 'structural'],
  'teaching-jobs': ['teacher', 'teaching', 'education', 'tutor', 'instructor', 'professor', 'school', 'curriculum', 'trainer'],
  'sales-jobs': ['sales', 'account executive', 'business development', 'SDR', 'BDR', 'revenue', 'closing', 'quota'],
  'marketing-jobs': ['marketing', 'content', 'SEO', 'social media', 'growth', 'brand', 'digital marketing', 'copywriting', 'campaign'],
  'legal-jobs': ['legal', 'lawyer', 'attorney', 'paralegal', 'compliance', 'counsel', 'solicitor', 'barrister'],
  'logistics-warehouse-jobs': ['logistics', 'warehouse', 'supply chain', 'operations', 'shipping', 'delivery', 'procurement', 'inventory'],
  'hospitality-catering-jobs': ['hospitality', 'hotel', 'restaurant', 'catering', 'chef', 'food', 'beverage', 'front desk'],
  'construction-jobs': ['construction', 'building', 'architect', 'contractor', 'site manager', 'surveyor', 'plumber', 'electrician'],
};

// ─── Admin jobs from Supabase ────────────────────────────────────────────────

async function fetchAdminJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('is_active', true)
    .eq('source', 'admin')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Job[];
}

// ─── Free-source cache (30 min in-memory) ────────────────────────────────────

type FreeSourceCache = { jobs: Job[]; at: number };
let freeSourceCache: FreeSourceCache | null = null;
const FREE_SOURCE_CACHE_MS = 30 * 60 * 1000;

// ─── Adzuna client-side cache (1 hour in-memory) ──────────────────────────────

type AdzunaCache = { result: { jobs: Job[]; total: number }; at: number };
const adzunaCache = new Map<string, AdzunaCache>();
const ADZUNA_CACHE_MS = 60 * 60 * 1000;

const ALL_JOBICY_INDUSTRIES = [
  'admin-support', 'supporting', 'technical-support',
  'copywriting', 'marketing', 'smm', 'design-multimedia',
  'management', 'it-jobs',
];

async function fetchFreeSourceJobs(): Promise<Job[]> {
  const now = Date.now();
  if (freeSourceCache && now - freeSourceCache.at < FREE_SOURCE_CACHE_MS) {
    return freeSourceCache.jobs;
  }

  const [remoteOkResult, remotivePairs, jobicyJobs, wwrJobs] = await Promise.all([
    fetchRemoteOKJobs(100).catch(() => ({ jobs: [] as Job[], total: 0 })),
    fetchRemotiveJobs(100).catch(() => [] as { job: Job; category: any }[]),
    fetchJobicyJobs(ALL_JOBICY_INDUSTRIES, 100).catch(() => [] as Job[]),
    fetchWWRJobsAll(100).catch(() => [] as Job[]),
  ]);

  const all: Job[] = [
    ...remoteOkResult.jobs,
    ...remotivePairs.map((p) => p.job),
    ...jobicyJobs,
    ...wwrJobs,
  ];

  // Dedupe by title + company
  const seen = new Set<string>();
  const deduped: Job[] = [];
  for (const job of all) {
    const key = `${job.title.toLowerCase().trim()}-${job.company.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(job);
    }
  }

  // Sort newest first
  deduped.sort((a, b) => new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime());

  freeSourceCache = { jobs: deduped, at: now };
  return deduped;
}

// ─── Filters ─────────────────────────────────────────────────────────────────

/** Job offers visa sponsorship — either explicit field (Arbeitnow) or keyword in text. */
function mentionsSponsorship(job: Job): boolean {
  if (job.visa_sponsorship === 'YES') return true;
  if (job.visa_sponsorship === 'NO') return false;
  const text = [job.title, job.description].filter(Boolean).join(' ').toLowerCase();
  return (
    text.includes('visa sponsor') ||
    text.includes('sponsor visa') ||
    text.includes('sponsorship available') ||
    text.includes('we sponsor')
  );
}

function matchesSearch(job: Job, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const text = [job.title, job.company, job.sector, job.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes(q);
}

function matchesSector(job: Job, sector: string): boolean {
  const keywords = SECTOR_KEYWORDS[sector];
  if (!keywords) return true; // unknown sector slug — don't filter
  const text = [job.title, job.company, job.sector, job.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return keywords.some((k) => text.toLowerCase().includes(k.toLowerCase()));
}

// ─── jobsService ─────────────────────────────────────────────────────────────

export const jobsService = {
  getJobs: async (filters?: JobFilters, limit = 20, offset = 0) => {
    // Global tab: aggregate all 4 free sources + admin jobs
    if (filters?.globalRemote) {
      const [freeJobs, adminJobs, arbeitnowAll] = await Promise.all([
        fetchFreeSourceJobs().catch(() => [] as Job[]),
        fetchAdminJobs().catch(() => [] as Job[]),
        fetchArbeitnowJobs().catch(() => [] as Job[]),
      ]);
      const all = [...adminJobs, ...freeJobs, ...arbeitnowAll];
      // Dedupe
      const seen = new Set<string>();
      const deduped: Job[] = [];
      for (const job of all) {
        const key = `${job.title.toLowerCase().trim()}-${job.company.toLowerCase().trim()}`;
        if (!seen.has(key)) { seen.add(key); deduped.push(job); }
      }
      let filtered = deduped;
      if (filters.sector) filtered = filtered.filter((j) => matchesSector(j, filters.sector!));
      if (filters.searchQuery) filtered = filtered.filter((j) => matchesSearch(j, filters.searchQuery!));
      return { jobs: filtered.slice(offset, offset + limit), total: filtered.length };
    }

    // Country-specific tabs: Adzuna (primary) + free sources (supplement on page 1)
    const page = Math.floor(offset / limit) + 1;
    // Combine user text query + sector slug for Adzuna (it understands both as keywords)
    const adzunaWhat = [filters?.searchQuery, filters?.sector].filter(Boolean).join(' ') || undefined;
    const adzunaFilters: AdzunaFilters = {
      country: filters?.country || 'gb',
      what: adzunaWhat,
      visaSponsorship: filters?.visaSponsorship,
      remote: filters?.remote,
      page,
      resultsPerPage: limit,
    };

    const adzunaCacheKey = [
      adzunaFilters.country, adzunaFilters.what ?? '',
      adzunaFilters.visaSponsorship ? '1' : '0',
      adzunaFilters.remote ? '1' : '0',
      page, limit,
    ].join('_');
    const cachedAdzuna = adzunaCache.get(adzunaCacheKey);
    let adzunaResult = { jobs: [] as Job[], total: 0 };
    let adzunaFailed = false;
    if (cachedAdzuna && Date.now() - cachedAdzuna.at < ADZUNA_CACHE_MS) {
      adzunaResult = cachedAdzuna.result;
    } else {
      try {
        adzunaResult = await fetchAdzunaJobs(adzunaFilters);
        adzunaCache.set(adzunaCacheKey, { result: adzunaResult, at: Date.now() });
      } catch {
        adzunaFailed = true;
      }
    }

    const country = filters?.country || 'gb';
    const [freeJobs, adminJobs, arbeitnowJobs] = offset === 0
      ? await Promise.all([
          fetchFreeSourceJobs().catch(() => [] as Job[]),
          fetchAdminJobs().catch(() => [] as Job[]),
          fetchArbeitnowJobsForCountry(country).catch(() => [] as Job[]),
        ])
      : [[] as Job[], [] as Job[], [] as Job[]];

    // Combine global remote + country-filtered Arbeitnow jobs
    let supplementJobs = [...freeJobs, ...arbeitnowJobs];

    if (filters?.sector) {
      supplementJobs = supplementJobs.filter((j) => matchesSector(j, filters.sector!));
    }
    if (filters?.visaSponsorship) {
      supplementJobs = supplementJobs.filter(mentionsSponsorship);
    }
    if (filters?.searchQuery) {
      supplementJobs = supplementJobs.filter((j) => matchesSearch(j, filters.searchQuery!));
    }

    // Filter admin jobs to match active tab + sector
    let adminSupply = adminJobs;
    if (filters?.sector) adminSupply = adminSupply.filter((j) => matchesSector(j, filters.sector!));
    if (filters?.visaSponsorship) adminSupply = adminSupply.filter(mentionsSponsorship);
    if (filters?.searchQuery) adminSupply = adminSupply.filter((j) => matchesSearch(j, filters.searchQuery!));

    // Merge Adzuna + free supplement + admin jobs, dedupe by title+company
    const combined = [...adminSupply, ...adzunaResult.jobs, ...supplementJobs];
    const seen = new Set<string>();
    const deduped: Job[] = [];
    for (const job of combined) {
      const key = `${job.title.toLowerCase().trim()}-${job.company.toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(job);
      }
    }

    return {
      jobs: deduped,
      total: adzunaResult.total + supplementJobs.length,
      adzunaFailed,
    };
  },

  // Get single job — check Supabase cache first (saved jobs), else fetch from Adzuna
  getJobById: async (jobId: string) => {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (data) return data as Job;

    throw new Error('Job not found');
  },

  // Cache job to Supabase and save bookmark
  saveJob: async (jobId: string, jobData?: Job) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (jobData) {
      await supabase.from('jobs').upsert({
        id: jobData.id,
        title: jobData.title,
        company: jobData.company,
        company_logo_url: jobData.company_logo_url,
        country: jobData.country,
        city: jobData.city,
        job_type: jobData.job_type,
        sector: jobData.sector,
        visa_sponsorship: jobData.visa_sponsorship,
        salary_range: jobData.salary_range,
        requirements: jobData.requirements,
        description: jobData.description,
        apply_url: jobData.apply_url,
        posted_date: jobData.posted_date,
        expires_at: jobData.expires_at,
        is_active: true,
        is_featured: false,
        view_count: 0,
        application_count: 0,
      }, { onConflict: 'id', ignoreDuplicates: true });
    }

    const { data, error } = await supabase
      .from('saved_jobs')
      .upsert({ user_id: user.id, job_id: jobId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  unsaveJob: async (jobId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .match({ user_id: user.id, job_id: jobId });

    if (error) throw error;
  },

  getSavedJobs: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('saved_jobs')
      .select(`*, jobs (*)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  isJobSaved: async (jobId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('saved_jobs')
      .select('id')
      .match({ user_id: user.id, job_id: jobId })
      .single();

    return !!data;
  },

  trackApplication: async (jobId: string) => {
    await supabase.rpc('increment_job_applications', { job_id: jobId }).maybeSingle();
  },
};
