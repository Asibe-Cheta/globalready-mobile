import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase';

type WorkExperienceAssistInput = {
  jobTitle: string;
  company?: string;
  industry?: string;
  years?: string;
  existing?: string;
};

type WorkExperienceAssistResponse = {
  bullets: string[];
};

export const generateWorkExperienceBullets = async (
  input: WorkExperienceAssistInput
): Promise<WorkExperienceAssistResponse> => {
  const response = await fetch(`${supabaseUrl}/functions/v1/work-experience-assist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify(input),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Edge function error (${response.status})`);
  }

  return JSON.parse(text) as WorkExperienceAssistResponse;
};
