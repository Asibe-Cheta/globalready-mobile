import { supabase } from '@/lib/supabase';
import { Job } from '@/types/job';
import { fetchAdzunaJobs, AdzunaFilters } from '@/services/adzuna';
import { fetchRemoteOKJobs } from '@/services/remoteok';

export interface JobFilters {
  country?: string;        // Adzuna country code e.g. 'gb'
  sector?: string;
  visaSponsorship?: boolean;
  remote?: boolean;
  searchQuery?: string;
  /** When true, fetch global work-from-anywhere jobs from RemoteOK instead of Adzuna. */
  globalRemote?: boolean;
}

export const jobsService = {
  // Fetch jobs: from RemoteOK for global remote, otherwise from Adzuna (unchanged).
  getJobs: async (filters?: JobFilters, limit = 20, offset = 0) => {
    if (filters?.globalRemote) {
      return fetchRemoteOKJobs(limit, offset, filters.searchQuery);
    }
    const page = Math.floor(offset / limit) + 1;
    const adzunaFilters: AdzunaFilters = {
      country: filters?.country || 'gb',
      what: filters?.searchQuery,
      visaSponsorship: filters?.visaSponsorship,
      remote: filters?.remote,
      page,
      resultsPerPage: limit,
    };
    return fetchAdzunaJobs(adzunaFilters);
  },

  // Get single job — check Supabase cache first (saved jobs), else fetch from Adzuna
  getJobById: async (jobId: string) => {
    // jobId format: "adzuna_<adzunaId>" or plain Supabase UUID
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (data) return data as Job;

    // If not cached, job was not saved — shouldn't normally happen
    throw new Error('Job not found');
  },

  // Cache job to Supabase and save bookmark
  saveJob: async (jobId: string, jobData?: Job) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // If we have the full job object, upsert it to jobs table for persistence
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

  // Unsave job
  unsaveJob: async (jobId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .match({ user_id: user.id, job_id: jobId });

    if (error) throw error;
  },

  // Get saved jobs (reads from Supabase cache)
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

  // Check if job is saved
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

  // Track application click
  trackApplication: async (jobId: string) => {
    await supabase.rpc('increment_job_applications', { job_id: jobId }).maybeSingle();
  },
};
