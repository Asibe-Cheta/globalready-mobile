import { Job } from '@/types/job';

const JOBICY_API = 'https://jobicy.com/api/v2/remote-jobs';

/** Jobicy industry slugs that map to our worldwide categories. No geo = worldwide. */
export const JOBICY_INDUSTRIES_BY_CATEGORY = {
  'admin-support': ['admin-support', 'supporting', 'technical-support'],
  'marketing-content': ['copywriting', 'marketing', 'smm', 'design-multimedia'],
  operations: ['management'],
} as const;

interface JobicyJob {
  id?: string;
  jobTitle: string;
  companyName: string;
  jobIndustry?: string;
  jobGeo?: string;
  jobExcerpt?: string;
  jobDescription?: string;
  url: string;
  pubDate?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  jobType?: string;
  companyLogo?: string;
}

function formatSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  if (min && max && min > 0 && max > 0) return `$${Math.round(min / 1000)}k – $${Math.round(max / 1000)}k`;
  if (min && min > 0) return `From $${Math.round(min / 1000)}k`;
  if (max && max > 0) return `Up to $${Math.round(max / 1000)}k`;
  return null;
}

function mapToJob(r: JobicyJob, sourceId: string): Job {
  const date = r.pubDate || new Date().toISOString();
  const salaryRange = formatSalary(r.salaryMin, r.salaryMax);
  return {
    id: `jobicy_${sourceId}`,
    title: r.jobTitle || 'Remote position',
    company: r.companyName || 'Company',
    company_logo_url: r.companyLogo || null,
    country: r.jobGeo || 'Worldwide',
    city: null,
    job_type: r.jobType || 'Full-Time',
    sector: r.jobIndustry || 'Remote',
    visa_sponsorship: 'UNKNOWN',
    salary_range: salaryRange,
    requirements: null,
    description: r.jobExcerpt || r.jobDescription || '',
    apply_url: r.url || null,
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

/**
 * Fetch remote jobs from Jobicy for given industry slugs. No geo = worldwide.
 */
export async function fetchJobicyJobs(
  industrySlugs: string[],
  limit = 50
): Promise<Job[]> {
  const all: Job[] = [];
  const seen = new Set<string>();

  for (const slug of industrySlugs) {
    try {
      const url = `${JOBICY_API}?count=${Math.min(50, limit)}&industry=${encodeURIComponent(slug)}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const jobs: JobicyJob[] = Array.isArray(data) ? data : (Array.isArray(data?.jobs) ? data.jobs : []);
      for (const j of jobs) {
        const id = (j as any).id ?? j.jobId ?? `${j.jobTitle}-${j.companyName}`;
        const sid = String(id);
        if (seen.has(sid)) continue;
        seen.add(sid);
        all.push(mapToJob(j, sid));
      }
    } catch {
      // skip this industry on error
    }
  }

  return all;
}
