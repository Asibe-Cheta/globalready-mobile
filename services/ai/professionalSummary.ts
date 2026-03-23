import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase';

type SummaryInput = {
  cvData: Record<string, any>;
};

type SummaryResponse = {
  summary: string;
};

export const generateProfessionalSummary = async (
  input: SummaryInput
): Promise<SummaryResponse> => {
  const response = await fetch(`${supabaseUrl}/functions/v1/generate-summary`, {
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

  return JSON.parse(text) as SummaryResponse;
};
