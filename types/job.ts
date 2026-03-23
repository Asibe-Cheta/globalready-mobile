export interface JobRequirements {
  responsibilities?: string[];
  requirements?: string[];
  experience_level?: string;
  competition_level?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  company_logo_url: string | null;
  country: string;
  city: string | null;
  job_type: string;
  sector: string;
  visa_sponsorship: 'YES' | 'NO' | 'UNKNOWN';
  salary_range: string | null;
  requirements: JobRequirements | null;
  description: string;
  apply_url: string | null;
  posted_date: string;
  expires_at: string | null;
  is_active: boolean;
  is_featured: boolean;
  view_count: number;
  application_count: number;
  created_at: string;
  updated_at: string;
}

export interface InDemandRole {
  id: string;
  rank: number;
  title: string;
  icon: string;
  accent_color: string;
  reason: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
