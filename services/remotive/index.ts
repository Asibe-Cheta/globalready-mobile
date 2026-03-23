import { Job } from '@/types/job';

const REMOTIVE_API = 'https://remotive.com/api/remote-jobs';

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo?: string;
  category: string;
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary?: string;
  description: string;
}

/** Remotive categories that map to our worldwide categories (lowercase for lookup). */
const REMOTIVE_CATEGORY_MAP: Record<string, 'admin-support' | 'marketing-content' | 'operations'> = {
  'customer service': 'admin-support',
  'marketing': 'marketing-content',
  'writing': 'marketing-content',
  'design': 'marketing-content',
  'project management': 'operations',
};

function mapToJob(r: RemotiveJob, sourceId: string): Job {
  const date = r.publication_date || new Date().toISOString();
  return {
    id: `remotive_${sourceId}`,
    title: r.title || 'Remote position',
    company: r.company_name || 'Company',
    company_logo_url: r.company_logo || null,
    country: r.candidate_required_location || 'Worldwide',
    city: null,
    job_type: r.job_type || 'Full-Time',
    sector: r.category || 'Remote',
    visa_sponsorship: 'UNKNOWN',
    salary_range: r.salary || null,
    requirements: null,
    description: r.description ? r.description.replace(/<[^>]*>/g, ' ').slice(0, 2000) : '',
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
 * Fetch Remotive jobs. One request (no category filter) to respect rate limit (max ~4/day).
 * Returns jobs with a category hint so aggregator can filter.
 */
export async function fetchRemotiveJobs(limit = 100): Promise<{ job: Job; category: 'admin-support' | 'marketing-content' | 'operations' | null }[]> {
  try {
    const res = await fetch(`${REMOTIVE_API}?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    const jobs: RemotiveJob[] = data.jobs || [];
  return jobs.map((j) => {
    const job = mapToJob(j, String(j.id));
    const catKey = (j.category || '').toLowerCase().trim();
    const category = REMOTIVE_CATEGORY_MAP[catKey] ?? null;
    return { job, category };
  });
  } catch {
    return [];
  }
}
