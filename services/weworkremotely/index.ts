import { Job } from '@/types/job';

const WWR_FEEDS = {
  all: 'https://weworkremotely.com/remote-jobs.rss',
  customerSupport: 'https://weworkremotely.com/categories/remote-customer-support-jobs.rss',
  salesMarketing: 'https://weworkremotely.com/categories/remote-sales-and-marketing-jobs.rss',
} as const;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

function extractTag(html: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = html.match(re);
  return m ? stripHtml(m[1]) : null;
}

/**
 * Parse RSS XML into items with title, link, description, pubDate.
 */
function parseRssItems(xml: string): { title: string; link: string; description: string; pubDate: string }[] {
  const items: { title: string; link: string; description: string; pubDate: string }[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = extractTag(block, 'title') || '';
    const link = extractTag(block, 'link') || '';
    const description = stripHtml(extractTag(block, 'description') || '').slice(0, 2000);
    const pubDate = extractTag(block, 'pubDate') || new Date().toISOString();
    if (title && link) items.push({ title, link, description, pubDate });
  }
  return items;
}

function mapToJob(
  item: { title: string; link: string; description: string; pubDate: string },
  id: string
): Job {
  return {
    id: `weworkremotely_${id}`,
    title: item.title,
    company: 'Company',
    company_logo_url: null,
    country: 'Worldwide',
    city: null,
    job_type: 'Full-Time',
    sector: 'Remote',
    visa_sponsorship: 'UNKNOWN',
    salary_range: null,
    requirements: null,
    description: item.description,
    apply_url: item.link,
    posted_date: item.pubDate,
    expires_at: null,
    is_active: true,
    is_featured: false,
    view_count: 0,
    application_count: 0,
    created_at: item.pubDate,
    updated_at: item.pubDate,
  };
}

/** Fetch We Work Remotely jobs from RSS. No country filter = worldwide. */
export async function fetchWWRJobs(
  feed: keyof typeof WWR_FEEDS = 'all',
  limit = 80
): Promise<Job[]> {
  try {
    const res = await fetch(WWR_FEEDS[feed]);
    if (!res.ok) return [];
    const xml = await res.text();
    const items = parseRssItems(xml).slice(0, limit);
    return items.map((item, i) => mapToJob(item, `${feed}_${i}_${item.link.length}`));
  } catch {
    return [];
  }
}

/** Fetch from all relevant WWR feeds and merge (for aggregator). */
export async function fetchWWRJobsAll(limit = 100): Promise<Job[]> {
  const [all, support, marketing] = await Promise.all([
    fetchWWRJobs('all', 50),
    fetchWWRJobs('customerSupport', 30),
    fetchWWRJobs('salesMarketing', 30),
  ]);
  const seen = new Set<string>();
  const out: Job[] = [];
  for (const j of [...support, ...marketing, ...all]) {
    const key = `${j.title.toLowerCase()}-${j.apply_url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(j);
    if (out.length >= limit) break;
  }
  return out;
}
