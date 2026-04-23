import { Job } from '@/types/job';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Adzuna country codes that match GlobalReady's target markets
export const ADZUNA_COUNTRIES: { code: string; label: string; flag: string }[] = [
  { code: 'gb', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'de', label: 'Germany', flag: '🇩🇪' },
  { code: 'nl', label: 'Netherlands', flag: '🇳🇱' },
  { code: 'ca', label: 'Canada', flag: '🇨🇦' },
  { code: 'au', label: 'Australia', flag: '🇦🇺' },
  { code: 'ie', label: 'Ireland', flag: '🇮🇪' },
  { code: 'us', label: 'United States', flag: '🇺🇸' },
  { code: 'at', label: 'Austria', flag: '🇦🇹' },
  { code: 'ch', label: 'Switzerland', flag: '🇨🇭' },
  { code: 'nz', label: 'New Zealand', flag: '🇳🇿' },
];

export interface AdzunaFilters {
  country: string;         // Adzuna country code e.g. 'gb'
  what?: string;           // search keywords
  visaSponsorship?: boolean;
  remote?: boolean;
  page?: number;
  resultsPerPage?: number;
}

interface AdzunaResult {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  company: { display_name: string };
  location: { display_name: string; area: string[] };
  category: { label: string };
  contract_time?: string;
  contract_type?: string;
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string;
  // Reed jobs merged in edge function
  _source?: 'reed';
  _visa_sponsorship?: 'YES' | 'NO' | 'UNKNOWN';
}


function formatSalary(min?: number, max?: number, country?: string): string | null {
  if (!min && !max) return null;
  const currencyMap: Record<string, string> = {
    gb: '£', de: '€', nl: '€', ie: '€', at: '€', ch: '₣',
    ca: 'CA$', au: 'A$', nz: 'NZ$', us: '$',
  };
  const sym = currencyMap[country ?? 'gb'] ?? '£';
  const fmt = (n: number) =>
    n >= 1000 ? `${sym}${Math.round(n / 1000)}k` : `${sym}${Math.round(n)}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

function mapJobType(contractTime?: string, contractType?: string): string {
  if (contractTime === 'full_time') return 'Full-Time';
  if (contractTime === 'part_time') return 'Part-Time';
  if (contractType === 'permanent') return 'Permanent';
  if (contractType === 'contract') return 'Contract';
  return 'Full-Time';
}

function mapToJob(r: AdzunaResult, country: string): Job {
  const isReed = r._source === 'reed';
  return {
    id: isReed ? r.id : `adzuna_${r.id}`,
    title: r.title,
    company: r.company.display_name,
    company_logo_url: null,
    country: isReed ? 'United Kingdom' : (ADZUNA_COUNTRIES.find((c) => c.code === country)?.label ?? country.toUpperCase()),
    city: r.location.display_name,
    job_type: mapJobType(r.contract_time, r.contract_type),
    sector: r.category.label,
    visa_sponsorship: r._visa_sponsorship ?? 'UNKNOWN',
    salary_range: formatSalary(r.salary_min, r.salary_max, isReed ? 'gb' : country),
    requirements: null,
    description: (r.description ?? '').replace(/<[^>]*>/g, '').trim(),
    apply_url: r.redirect_url,
    posted_date: r.created,
    expires_at: null,
    is_active: true,
    is_featured: false,
    view_count: 0,
    application_count: 0,
    created_at: r.created,
    updated_at: r.created,
  };
}

export async function fetchAdzunaJobs(
  filters: AdzunaFilters
): Promise<{ jobs: Job[]; total: number }> {
  const {
    country = 'gb',
    what,
    visaSponsorship,
    remote,
    page = 1,
    resultsPerPage = 20,
  } = filters;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/fetch-jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ country, what, visaSponsorship, remote, page, resultsPerPage }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Adzuna API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  return {
    jobs: (data.jobs ?? []).map((r: AdzunaResult) => mapToJob(r, country)),
    total: data.total ?? 0,
  };
}
