import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

export type SkillsHubDraft = {
  last_route?: string | null;
  selected_path?: string | null;
  reason?: string | null;
  access?: string | null;
  urgency?: string | null;
  availability?: string | null;
  skills?: Record<string, boolean>;
  updated_at?: string;
};

export type TailorCvDraft = {
  last_route?: string | null;
  job_title?: string | null;
  job_description?: string | null;
  updated_at?: string;
};

const SKILLS_HUB_KEY = 'gr_skills_hub_draft';
const TAILOR_CV_KEY = 'gr_tailor_cv_draft';

const parseTimestamp = (value?: string | null) => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getCurrentUserId = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
};

const fetchLatestSkillsHubDraft = async (userId: string): Promise<SkillsHubDraft | null> => {
  const { data, error } = await supabase
    .from('skills_hub_progress')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    last_route: data.last_route,
    selected_path: data.selected_path,
    reason: data.reason,
    access: data.access,
    urgency: data.urgency,
    availability: data.availability,
    skills: data.skills || undefined,
    updated_at: data.updated_at,
  };
};

const upsertSkillsHubDraft = async (userId: string, draft: SkillsHubDraft) => {
  const payload = {
    user_id: userId,
    last_route: draft.last_route ?? null,
    selected_path: draft.selected_path ?? null,
    reason: draft.reason ?? null,
    access: draft.access ?? null,
    urgency: draft.urgency ?? null,
    availability: draft.availability ?? null,
    skills: draft.skills ?? null,
    updated_at: draft.updated_at ?? new Date().toISOString(),
  };

  const { data: existing, error: existingError } = await supabase
    .from('skills_hub_progress')
    .select('id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) return;

  if (existing?.id) {
    await supabase.from('skills_hub_progress').update(payload).eq('id', existing.id);
    return;
  }

  await supabase.from('skills_hub_progress').insert(payload);
};

const clearRemoteSkillsHubDraft = async (userId: string) => {
  await supabase.from('skills_hub_progress').delete().eq('user_id', userId);
};

const fetchLatestTailorCvDraft = async (userId: string): Promise<TailorCvDraft | null> => {
  const { data, error } = await supabase
    .from('tailor_cv_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    last_route: data.last_route,
    job_title: data.job_title,
    job_description: data.job_description,
    updated_at: data.updated_at,
  };
};

const upsertTailorCvDraft = async (userId: string, draft: TailorCvDraft) => {
  const payload = {
    user_id: userId,
    last_route: draft.last_route ?? null,
    job_title: draft.job_title ?? null,
    job_description: draft.job_description ?? null,
    updated_at: draft.updated_at ?? new Date().toISOString(),
  };

  const { data: existing, error: existingError } = await supabase
    .from('tailor_cv_sessions')
    .select('id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) return;

  if (existing?.id) {
    await supabase.from('tailor_cv_sessions').update(payload).eq('id', existing.id);
    return;
  }

  await supabase.from('tailor_cv_sessions').insert(payload);
};

const clearRemoteTailorCvDraft = async (userId: string) => {
  await supabase.from('tailor_cv_sessions').delete().eq('user_id', userId);
};

export async function loadSkillsHubDraft(): Promise<SkillsHubDraft | null> {
  const raw = await AsyncStorage.getItem(SKILLS_HUB_KEY);
  let localDraft: SkillsHubDraft | null = null;
  if (raw) {
    try {
      localDraft = JSON.parse(raw) as SkillsHubDraft;
    } catch {
      localDraft = null;
    }
  }

  const userId = await getCurrentUserId();
  if (!userId) return localDraft;

  const remoteDraft = await fetchLatestSkillsHubDraft(userId);
  if (!remoteDraft) return localDraft;

  const localTimestamp = parseTimestamp(localDraft?.updated_at);
  const remoteTimestamp = parseTimestamp(remoteDraft.updated_at);

  if (remoteTimestamp >= localTimestamp) {
    const merged = { ...(localDraft || {}), ...remoteDraft };
    await AsyncStorage.setItem(SKILLS_HUB_KEY, JSON.stringify(merged));
    return merged;
  }

  if (localDraft) {
    await upsertSkillsHubDraft(userId, localDraft);
  }

  return localDraft;
}

export async function saveSkillsHubDraft(patch: SkillsHubDraft): Promise<void> {
  const existing = await loadSkillsHubDraft();
  const next: SkillsHubDraft = {
    ...(existing || {}),
    ...patch,
    updated_at: new Date().toISOString(),
  };
  await AsyncStorage.setItem(SKILLS_HUB_KEY, JSON.stringify(next));

  const userId = await getCurrentUserId();
  if (!userId) return;
  await upsertSkillsHubDraft(userId, next);
}

export async function clearSkillsHubDraft(): Promise<void> {
  await AsyncStorage.removeItem(SKILLS_HUB_KEY);

  const userId = await getCurrentUserId();
  if (!userId) return;
  await clearRemoteSkillsHubDraft(userId);
}

export async function loadTailorCvDraft(): Promise<TailorCvDraft | null> {
  const raw = await AsyncStorage.getItem(TAILOR_CV_KEY);
  let localDraft: TailorCvDraft | null = null;
  if (raw) {
    try {
      localDraft = JSON.parse(raw) as TailorCvDraft;
    } catch {
      localDraft = null;
    }
  }

  const userId = await getCurrentUserId();
  if (!userId) return localDraft;

  const remoteDraft = await fetchLatestTailorCvDraft(userId);
  if (!remoteDraft) return localDraft;

  const localTimestamp = parseTimestamp(localDraft?.updated_at);
  const remoteTimestamp = parseTimestamp(remoteDraft.updated_at);

  if (remoteTimestamp >= localTimestamp) {
    const merged = { ...(localDraft || {}), ...remoteDraft };
    await AsyncStorage.setItem(TAILOR_CV_KEY, JSON.stringify(merged));
    return merged;
  }

  if (localDraft) {
    await upsertTailorCvDraft(userId, localDraft);
  }

  return localDraft;
}

export async function saveTailorCvDraft(patch: TailorCvDraft): Promise<void> {
  const existing = await loadTailorCvDraft();
  const next: TailorCvDraft = {
    ...(existing || {}),
    ...patch,
    updated_at: new Date().toISOString(),
  };
  await AsyncStorage.setItem(TAILOR_CV_KEY, JSON.stringify(next));

  const userId = await getCurrentUserId();
  if (!userId) return;
  await upsertTailorCvDraft(userId, next);
}

export async function clearTailorCvDraft(): Promise<void> {
  await AsyncStorage.removeItem(TAILOR_CV_KEY);

  const userId = await getCurrentUserId();
  if (!userId) return;
  await clearRemoteTailorCvDraft(userId);
}
