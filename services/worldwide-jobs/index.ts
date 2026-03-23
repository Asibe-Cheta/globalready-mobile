import { Job } from '@/types/job';
import { fetchJobicyJobs, JOBICY_INDUSTRIES_BY_CATEGORY } from '@/services/jobicy';
import { fetchRemoteOKJobs } from '@/services/remoteok';
import { fetchRemotiveJobs } from '@/services/remotive';
import { fetchWWRJobsAll } from '@/services/weworkremotely';

export type WorldwideCategory = 'admin-support' | 'marketing-content' | 'operations';

/** Keyword search terms per category for RemoteOK and WWR filtering. Not country-limited. */
const KEYWORDS_BY_CATEGORY: Record<WorldwideCategory, string[]> = {
  'admin-support': ['virtual assistant', 'customer support', 'admin support', 'administrative', 'support specialist'],
  'marketing-content': ['social media', 'email marketing', 'copywriting', 'content', 'video editing', 'marketing'],
  operations: ['project management', 'operations coordinator', 'project assistant', 'operations manager'],
};

let remotiveCache: { jobs: { job: Job; category: WorldwideCategory | null }[]; at: number } | null = null;
const REMOTIVE_CACHE_MS = 10 * 60 * 1000; // 10 min

function dedupeKey(job: Job): string {
  return `${(job.title || '').toLowerCase().trim()}-${(job.company || '').toLowerCase().trim()}`;
}

function matchesCategory(job: Job, category: WorldwideCategory): boolean {
  const keywords = KEYWORDS_BY_CATEGORY[category];
  const text = [job.title, job.company, job.sector, job.description].filter(Boolean).join(' ').toLowerCase();
  return keywords.some((k) => text.includes(k));
}

async function getRemotiveJobs(): Promise<{ job: Job; category: WorldwideCategory | null }[]> {
  const now = Date.now();
  if (remotiveCache && now - remotiveCache.at < REMOTIVE_CACHE_MS) {
    return remotiveCache.jobs;
  }
  const result = await fetchRemotiveJobs(80);
  const mapped = result.map(({ job, category }) => ({
    job,
    category: category as WorldwideCategory | null,
  }));
  remotiveCache = { jobs: mapped, at: now };
  return mapped;
}

/**
 * Fetch worldwide jobs for one category from Jobicy, We Work Remotely, RemoteOK, and Remotive.
 * No country filter — all sources are worldwide.
 */
export async function fetchWorldwideJobs(
  category: WorldwideCategory,
  limit = 20,
  offset = 0
): Promise<{ jobs: Job[]; total: number }> {
  const industries = JOBICY_INDUSTRIES_BY_CATEGORY[category];
  const keywords = KEYWORDS_BY_CATEGORY[category];
  const searchQuery = keywords.slice(0, 3).join(' ');

  const [jobicyJobs, wwrJobs, remoteOkResult, remotivePairs] = await Promise.all([
    fetchJobicyJobs(industries, 50),
    fetchWWRJobsAll(80),
    fetchRemoteOKJobs(80, 0, searchQuery),
    getRemotiveJobs(),
  ]);

  const remotiveForCategory = remotivePairs
    .filter((p) => p.category === category || matchesCategory(p.job, category))
    .map((p) => p.job);

  const wwrFiltered = wwrJobs.filter((j) => matchesCategory(j, category));
  const remoteOkFiltered = remoteOkResult.jobs.filter((j) => matchesCategory(j, category));

  const combined: Job[] = [...jobicyJobs, ...wwrFiltered, ...remoteOkFiltered, ...remotiveForCategory];
  const seen = new Set<string>();
  const deduped: Job[] = [];
  for (const job of combined) {
    const key = dedupeKey(job);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(job);
  }

  deduped.sort((a, b) => {
    const da = new Date(a.posted_date).getTime();
    const db = new Date(b.posted_date).getTime();
    return db - da;
  });

  const total = deduped.length;
  const jobs = deduped.slice(offset, offset + limit);
  return { jobs, total };
}
