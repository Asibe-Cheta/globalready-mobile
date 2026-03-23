import { Job } from '@/types/job';

const REMOTEOK_API = 'https://remoteok.com/api';

interface RemoteOKMeta {
  last_updated?: number;
  legal?: string;
}

interface RemoteOKJob {
  id: string;
  slug?: string;
  epoch?: number;
  date?: string;
  company: string;
  company_logo?: string;
  logo?: string;
  position: string;
  tags?: string[];
  description?: string;
  location?: string;
  apply_url?: string;
  url?: string;
  salary_min?: number;
  salary_max?: number;
}

function isJobRow(item: RemoteOKJob | RemoteOKMeta): item is RemoteOKJob {
  return typeof (item as RemoteOKJob).position === 'string' && typeof (item as RemoteOKJob).id !== 'undefined';
}

function formatSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  if (min && max && min > 0 && max > 0) return `$${Math.round(min / 1000)}k – $${Math.round(max / 1000)}k`;
  if (min && min > 0) return `From $${Math.round(min / 1000)}k`;
  if (max && max > 0) return `Up to $${Math.round(max / 1000)}k`;
  return null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function mapToJob(r: RemoteOKJob): Job {
  const date = r.date || new Date().toISOString();
  const salaryRange = formatSalary(r.salary_min, r.salary_max);
  return {
    id: `remoteok_${r.id}`,
    title: r.position || 'Remote position',
    company: r.company || 'Company',
    company_logo_url: r.company_logo || r.logo || null,
    country: r.location || 'Worldwide',
    city: null,
    job_type: 'Full-Time',
    sector: r.tags?.[0] || 'Remote',
    visa_sponsorship: 'UNKNOWN',
    salary_range: salaryRange,
    requirements: null,
    description: r.description ? stripHtml(r.description) : '',
    apply_url: r.apply_url || r.url || null,
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

function matchesSearch(job: Job, searchQuery?: string): boolean {
  if (!searchQuery?.trim()) return true;
  const q = searchQuery.trim().toLowerCase();
  const text = [job.title, job.company, job.sector, job.description].filter(Boolean).join(' ').toLowerCase();
  return text.includes(q);
}

/**
 * Fetch global remote jobs from RemoteOK (work-from-anywhere).
 * No API key required. Use sparingly; consider caching to avoid excessive requests.
 */
export async function fetchRemoteOKJobs(
  limit = 20,
  offset = 0,
  searchQuery?: string
): Promise<{ jobs: Job[]; total: number }> {
  const res = await fetch(REMOTEOK_API);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RemoteOK API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const raw: (RemoteOKJob | RemoteOKMeta)[] = await res.json();
  const jobRows = raw.filter(isJobRow);
  const mapped = jobRows.map(mapToJob);
  const filtered = searchQuery?.trim()
    ? mapped.filter((j) => matchesSearch(j, searchQuery))
    : mapped;
  const total = filtered.length;
  const jobs = filtered.slice(offset, offset + limit);

  return { jobs, total };
}
