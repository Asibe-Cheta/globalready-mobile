import { Job } from '@/types/job';

const ARBEITNOW_API = 'https://arbeitnow.com/api/job-board-api';

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number;
  visa_sponsorship: boolean;
}

// Location keywords per country code — jobs matching these OR remote/worldwide are included
const COUNTRY_LOCATION_KEYWORDS: Record<string, string[]> = {
  gb: ['united kingdom', 'uk', 'england', 'london', 'manchester', 'birmingham', 'leeds', 'glasgow', 'edinburgh'],
  de: ['germany', 'deutschland', 'berlin', 'munich', 'münchen', 'hamburg', 'frankfurt', 'cologne', 'köln', 'düsseldorf', 'stuttgart'],
  nl: ['netherlands', 'holland', 'amsterdam', 'rotterdam', 'den haag', 'eindhoven', 'utrecht'],
  ca: ['canada', 'toronto', 'vancouver', 'montreal', 'calgary', 'ottawa'],
  au: ['australia', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide'],
  ie: ['ireland', 'dublin', 'cork', 'galway', 'limerick'],
  us: ['united states', 'usa', 'america', 'new york', 'san francisco', 'los angeles', 'chicago', 'austin', 'seattle'],
  at: ['austria', 'wien', 'vienna', 'graz', 'salzburg', 'innsbruck'],
  ch: ['switzerland', 'swiss', 'zurich', 'zürich', 'geneva', 'genf', 'basel', 'bern'],
  nz: ['new zealand', 'auckland', 'wellington', 'christchurch'],
};

const WORLDWIDE_KEYWORDS = ['worldwide', 'remote', 'global', 'anywhere'];

// All pages are cached together for 30 min — country filtering happens client-side
type ArbeitnowCache = { jobs: ArbeitnowJob[]; at: number };
let arbeitnowCache: ArbeitnowCache | null = null;
const CACHE_MS = 30 * 60 * 1000;

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Accept': 'application/json',
};

async function fetchAllArbeitnowJobs(): Promise<ArbeitnowJob[]> {
  const now = Date.now();
  if (arbeitnowCache && now - arbeitnowCache.at < CACHE_MS) {
    return arbeitnowCache.jobs;
  }
  // Fetch first 2 pages (150 jobs max — free tier)
  const [p1, p2] = await Promise.all([
    fetch(`${ARBEITNOW_API}?page=1`, { headers: FETCH_HEADERS }).then((r) => r.json()).catch(() => ({ data: [] })),
    fetch(`${ARBEITNOW_API}?page=2`, { headers: FETCH_HEADERS }).then((r) => r.json()).catch(() => ({ data: [] })),
  ]);
  const jobs: ArbeitnowJob[] = [...(p1.data ?? []), ...(p2.data ?? [])];
  arbeitnowCache = { jobs, at: now };
  return jobs;
}

function jobMatchesCountry(job: ArbeitnowJob, countryCode: string): boolean {
  const loc = (job.location ?? '').toLowerCase();
  if (WORLDWIDE_KEYWORDS.some((w) => loc.includes(w))) return true;
  if (job.remote) return true;
  const keywords = COUNTRY_LOCATION_KEYWORDS[countryCode] ?? [];
  return keywords.some((k) => loc.includes(k));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function mapJobType(types: string[], remote: boolean): string {
  if (types?.includes('full_time')) return 'Full-Time';
  if (types?.includes('part_time')) return 'Part-Time';
  if (types?.includes('contract')) return 'Contract';
  if (remote) return 'Remote';
  return 'Full-Time';
}

function mapToJob(r: ArbeitnowJob): Job {
  const date = new Date(r.created_at * 1000).toISOString();
  return {
    id: `arbeitnow_${r.slug}`,
    title: r.title,
    company: r.company_name,
    company_logo_url: null,
    country: r.location || 'Europe',
    city: r.location || null,
    job_type: mapJobType(r.job_types, r.remote),
    sector: r.tags?.[0] || 'Tech',
    visa_sponsorship: r.visa_sponsorship ? 'YES' : 'NO',
    salary_range: null,
    requirements: null,
    description: stripHtml(r.description).slice(0, 2000),
    apply_url: r.url,
    posted_date: date,
    expires_at: null,
    is_active: true,
    is_featured: false,
    view_count: 0,
    application_count: 0,
    created_at: date,
    updated_at: date,
  };
}

/** Fetch all Arbeitnow jobs with no country filter (for global/worldwide tabs). */
export async function fetchArbeitnowJobs(limit = 150): Promise<Job[]> {
  const raw = await fetchAllArbeitnowJobs();
  return raw.slice(0, limit).map(mapToJob);
}

/** Fetch Arbeitnow jobs filtered to a specific country + remote/worldwide listings. */
export async function fetchArbeitnowJobsForCountry(countryCode: string, limit = 150): Promise<Job[]> {
  const raw = await fetchAllArbeitnowJobs();
  return raw
    .filter((j) => jobMatchesCountry(j, countryCode))
    .slice(0, limit)
    .map(mapToJob);
}
