import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase, supabaseAnonKey, supabaseUrl } from '@/lib/supabase';
import { CVData } from '@/hooks/useCVBuilder';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const invokeEdgeFunction = async (
  functionName: string,
  body: Record<string, unknown>,
  maxRetries = 3
) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    if (!response.ok) {
      // Retry on WORKER_LIMIT with exponential backoff
      const isWorkerLimit = text.includes('WORKER_LIMIT') || text.includes('not having enough compute');
      if (isWorkerLimit && attempt < maxRetries) {
        const delay = (attempt + 1) * 4000; // 4s, 8s, 12s
        console.log(`WORKER_LIMIT hit for ${functionName}, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }
      throw new Error(text || `Edge function ${functionName} failed (${response.status})`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
};

export const analyzeCVJobMatch = async (cvText: string, jobDescription: string, jobTitle?: string) => {
  return invokeEdgeFunction('analyze-cv', { cvText, jobDescription, jobTitle });
};

export const tailorCV = async (cvData: unknown, jobDescription: string, jobTitle?: string) => {
  return invokeEdgeFunction('tailor-cv', { cvData, jobDescription, jobTitle });
};

export const tailorCVFromText = async (cvText: string, jobDescription: string, jobTitle?: string) => {
  return invokeEdgeFunction('tailor-cv', { cvText, jobDescription, jobTitle });
};

export const parseCVFile = async (filePath: string) => {
  return invokeEdgeFunction('parse-cv', { filePath });
};

export const parseCVBase64 = async (base64Data: string) => {
  return invokeEdgeFunction('parse-cv', { base64Data });
};

export const cvDataToText = (cv: CVData): string => {
  const lines: string[] = [];

  if (cv.personal?.fullName) lines.push(cv.personal.fullName);
  const contactParts = [cv.personal?.email, cv.personal?.phone, cv.personal?.country].filter(Boolean);
  if (contactParts.length) lines.push(contactParts.join(' | '));
  if (cv.personal?.linkedIn) lines.push(cv.personal.linkedIn);

  if (cv.summary) {
    lines.push('', 'PROFESSIONAL SUMMARY', cv.summary);
  }

  if (cv.experience?.length) {
    lines.push('', 'WORK EXPERIENCE');
    cv.experience.forEach((exp: any) => {
      lines.push(`${exp.jobTitle || ''} at ${exp.company || ''}`);
      const dates = `${exp.startDate || ''} - ${exp.currentlyWorking ? 'Present' : exp.endDate || ''}`;
      lines.push(dates);
      (exp.responsibilities || []).forEach((r: string) => lines.push(`- ${r}`));
      lines.push('');
    });
  }

  if (cv.education?.length) {
    lines.push('EDUCATION');
    cv.education.forEach((edu: any) => {
      lines.push(`${edu.degree || ''} in ${edu.fieldOfStudy || ''} - ${edu.institution || ''}`);
      if (edu.graduationDate) lines.push(`Graduated: ${edu.graduationDate}`);
      lines.push('');
    });
  }

  if (cv.skills?.length) {
    lines.push('SKILLS', cv.skills.join(', '), '');
  }

  if (cv.languages?.length) {
    lines.push('LANGUAGES');
    cv.languages.forEach((l: any) => lines.push(`${l.language} (${l.proficiency})`));
    lines.push('');
  }

  if (cv.certifications?.length) {
    lines.push('CERTIFICATIONS');
    cv.certifications.forEach((c: any) => lines.push(`${c.name} - ${c.issuer}`));
  }

  return lines.join('\n');
};

export const fetchUserLatestCV = async (): Promise<{
  id: string;
  cvData: any;
  type: 'built' | 'uploaded';
  parsePending: boolean;
} | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('cvs')
    .select('id, cv_data, type')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  const parsePending = !!(data.cv_data?.parse_pending && !data.cv_data?.raw_text);
  return { id: data.id, cvData: data.cv_data, type: (data.type || 'built') as 'built' | 'uploaded', parsePending };
};

/**
 * For uploaded CVs that haven't been parsed yet, retrieve the cached base64
 * from AsyncStorage, call the parse-cv edge function, and update the DB record.
 * Returns the extracted raw text.
 */
export const parseUploadedCVOnDemand = async (cvId: string): Promise<string> => {
  const base64 = await AsyncStorage.getItem('gr_pending_cv_base64');
  if (!base64) {
    throw new Error('CV file data not found. Please re-upload your CV.');
  }

  const parseResult = await parseCVBase64(base64);
  const rawText = parseResult.text;
  if (!rawText) {
    throw new Error('Could not extract text from the document');
  }

  // Update the DB record with parsed text and clear the pending flag
  await supabase
    .from('cvs')
    .update({ cv_data: { ...((await supabase.from('cvs').select('cv_data').eq('id', cvId).single()).data?.cv_data || {}), raw_text: rawText, parse_pending: false } })
    .eq('id', cvId);

  // Clean up the cached base64
  await AsyncStorage.removeItem('gr_pending_cv_base64');

  // Brief cooldown so the edge function worker releases before the next call (analyze-cv)
  await sleep(2000);

  return rawText;
};
