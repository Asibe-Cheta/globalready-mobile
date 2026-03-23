import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AssessmentData {
  // Step 2
  targetCountry?: string;
  jobSector?: string;
  currentStatus?: string;

  // Step 3
  yearsExperience?: number;
  educationLevel?: string;
  fieldOfStudy?: string;

  // Step 4
  languages?: Array<{ language: string; proficiency: string }>;
  hasAppliedBefore?: boolean;
  applicationHistory?: string;
  previousApplications?: string[];

  // Extra metadata from work abroad flow
  profession?: string;
  techDomain?: boolean;
  healthcareDomain?: boolean;
  certificatesStatus?: 'yes' | 'no' | 'unsure';
}

interface AssessmentContextType {
  assessmentData: AssessmentData;
  currentStep: number;
  resumeRoute: string | null;
  hasDraft: boolean;
  updateAssessment: (data: Partial<AssessmentData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  saveDraft: (nextRoute?: string, overrides?: Partial<AssessmentData>) => Promise<void>;
  saveAssessment: () => Promise<any>;
  resetAssessment: () => void;
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export const AssessmentProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [resumeRoute, setResumeRoute] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    loadDraft().catch(() => undefined);
  }, []);

  const updateAssessment = (data: Partial<AssessmentData>) => {
    setAssessmentData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => Math.max(1, prev - 1));

  const resetAssessment = () => {
    setAssessmentData({});
    setCurrentStep(1);
    setAssessmentId(null);
    setResumeRoute(null);
    setHasDraft(false);
    AsyncStorage.removeItem('gr_work_abroad_draft').catch(() => undefined);
  };

  const loadCachedDraft = async () => {
    const cached = await AsyncStorage.getItem('gr_work_abroad_draft');
    if (!cached) return null;
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  };

  const loadDraft = async () => {
    const cachedDraft = await loadCachedDraft();

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      if (cachedDraft) {
        setAssessmentId(cachedDraft.id || null);
        setCurrentStep(cachedDraft.current_step || 1);
        setAssessmentData(mapAssessmentRow(cachedDraft));
        setResumeRoute(cachedDraft.last_route || null);
        setHasDraft(true);
      }
      return;
    }

    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'incomplete')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setAssessmentId(data.id);
      setCurrentStep(data.current_step || 1);
      setAssessmentData(mapAssessmentRow(data));
      setResumeRoute(data.last_route || null);
      setHasDraft(true);
      await AsyncStorage.setItem('gr_work_abroad_draft', JSON.stringify(data));
      return;
    }

    if (cachedDraft) {
      setAssessmentId(cachedDraft.id || null);
      setCurrentStep(cachedDraft.current_step || 1);
      setAssessmentData(mapAssessmentRow(cachedDraft));
      setResumeRoute(cachedDraft.last_route || null);
      setHasDraft(true);

      if (cachedDraft.status !== 'completed') {
        const payload = {
          user_id: user.id,
          target_country: cachedDraft.target_country,
          job_sector: cachedDraft.job_sector,
          current_status: cachedDraft.current_status,
          years_experience: cachedDraft.years_experience,
          education_level: cachedDraft.education_level,
          field_of_study: cachedDraft.field_of_study,
          languages: cachedDraft.languages,
          has_applied_before: cachedDraft.has_applied_before,
          previous_applications: cachedDraft.previous_applications,
          profession: cachedDraft.profession,
          tech_domain: cachedDraft.tech_domain,
          healthcare_domain: cachedDraft.healthcare_domain,
          certificates_status: cachedDraft.certificates_status,
          status: 'incomplete',
          current_step: cachedDraft.current_step || 1,
          last_route: cachedDraft.last_route || null,
        };

        const syncResult = await supabase.from('assessments').insert(payload).select().single();
        if (!syncResult.error && syncResult.data) {
          setAssessmentId(syncResult.data.id);
          setResumeRoute(syncResult.data.last_route || null);
          setHasDraft(true);
          await AsyncStorage.setItem('gr_work_abroad_draft', JSON.stringify(syncResult.data));
        }
      }
    }
  };

  const saveDraft = async (nextRoute?: string, overrides?: Partial<AssessmentData>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const snapshot = { ...assessmentData, ...(overrides || {}) };
    if (overrides) {
      setAssessmentData((prev) => ({ ...prev, ...overrides }));
    }

    if (!snapshot.targetCountry) {
      throw new Error('Select a target country to continue.');
    }

    const previousApplications =
      snapshot.previousApplications ||
      (snapshot.applicationHistory
        ? [snapshot.applicationHistory]
        : undefined);

    const payload: Record<string, any> = {
      user_id: user.id,
      target_country: snapshot.targetCountry,
      job_sector: snapshot.jobSector,
      years_experience: snapshot.yearsExperience,
      education_level: snapshot.educationLevel,
      field_of_study: snapshot.fieldOfStudy,
      languages: snapshot.languages,
      has_applied_before: snapshot.hasAppliedBefore,
      previous_applications: previousApplications,
      profession: snapshot.profession,
      tech_domain: snapshot.techDomain,
      healthcare_domain: snapshot.healthcareDomain,
      certificates_status: snapshot.certificatesStatus,
      status: 'incomplete',
      current_step: currentStep,
      last_route: nextRoute,
    };

    if (snapshot.currentStatus) {
      payload.current_status = snapshot.currentStatus;
    }

    const trySave = async (data: Record<string, any>) => {
      if (assessmentId) {
        return supabase.from('assessments').update(data).eq('id', assessmentId).select().single();
      }
      return supabase.from('assessments').insert(data).select().single();
    };

    let result = await trySave(payload);
    if (result.error?.code === 'PGRST204' && `${result.error.message}`.includes('current_status')) {
      const { current_status, ...rest } = payload;
      result = await trySave(rest);
    }

    if (result.error) throw result.error;
    setAssessmentId(result.data.id);
    setResumeRoute(result.data.last_route || null);
    setHasDraft(true);
    await AsyncStorage.setItem('gr_work_abroad_draft', JSON.stringify(result.data));
  };

  const saveAssessment = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    if (!assessmentData.targetCountry) {
      throw new Error('Select a target country to continue.');
    }

    // Calculate match score
    const matchScore = calculateMatchScore(assessmentData);

    // Identify skill gaps
    const skillGaps = identifySkillGaps(assessmentData);

    // Generate recommendations
    const recommendations = generateRecommendations(assessmentData, matchScore);

    const eligibility =
      matchScore >= 70 ? 'strong' : matchScore >= 50 ? 'moderate' : 'weak';

    const previousApplications =
      assessmentData.previousApplications ||
      (assessmentData.applicationHistory
        ? [assessmentData.applicationHistory]
        : undefined);

    const payload: Record<string, any> = {
      user_id: user.id,
      target_country: assessmentData.targetCountry,
      job_sector: assessmentData.jobSector,
      years_experience: assessmentData.yearsExperience,
      education_level: assessmentData.educationLevel,
      field_of_study: assessmentData.fieldOfStudy,
      languages: assessmentData.languages,
      has_applied_before: assessmentData.hasAppliedBefore,
      previous_applications: previousApplications,
      match_score: matchScore,
      skill_gaps: skillGaps,
      recommended_actions: recommendations,
      eligibility_status: eligibility,
      profession: assessmentData.profession,
      tech_domain: assessmentData.techDomain,
      healthcare_domain: assessmentData.healthcareDomain,
      certificates_status: assessmentData.certificatesStatus,
      status: 'completed',
      current_step: currentStep,
    };

    if (assessmentData.currentStatus) {
      payload.current_status = assessmentData.currentStatus;
    }

    const trySave = async (data: Record<string, any>) => {
      if (assessmentId) {
        return supabase.from('assessments').update(data).eq('id', assessmentId).select().single();
      }
      return supabase.from('assessments').insert(data).select().single();
    };

    let result = await trySave(payload);
    if (result.error?.code === 'PGRST204' && `${result.error.message}`.includes('current_status')) {
      const { current_status, ...rest } = payload;
      result = await trySave(rest);
    }

    if (result.error) throw result.error;
    await AsyncStorage.removeItem('gr_work_abroad_draft');
    setResumeRoute(null);
    setHasDraft(false);
    return result.data;
  };

  return (
    <AssessmentContext.Provider
      value={{
        assessmentData,
        currentStep,
        resumeRoute,
        hasDraft,
        updateAssessment,
        nextStep,
        prevStep,
        saveDraft,
        saveAssessment,
        resetAssessment,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

const noopAsync = async () => ({} as any);
const noop = () => {};

const defaultContext: AssessmentContextType = {
  assessmentData: {},
  currentStep: 1,
  resumeRoute: null,
  hasDraft: false,
  updateAssessment: noop,
  nextStep: noop,
  prevStep: noop,
  saveDraft: noopAsync,
  saveAssessment: noopAsync,
  resetAssessment: noop,
};

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  return context ?? defaultContext;
};

const mapAssessmentRow = (row: any): AssessmentData => ({
  targetCountry: row.target_country,
  jobSector: row.job_sector,
  currentStatus: row.current_status,
  yearsExperience: row.years_experience,
  educationLevel: row.education_level,
  fieldOfStudy: row.field_of_study,
  languages: row.languages || undefined,
  hasAppliedBefore: row.has_applied_before,
  applicationHistory: row.previous_applications?.[0],
  previousApplications: row.previous_applications || undefined,
  profession: row.profession,
  techDomain: row.tech_domain,
  healthcareDomain: row.healthcare_domain,
  certificatesStatus: row.certificates_status,
});

// Helper functions
const calculateMatchScore = (data: AssessmentData): number => {
  let score = 0;

  // Education (30 points)
  if (data.educationLevel === 'masters' || data.educationLevel === 'phd')
    score += 30;
  else if (data.educationLevel === 'bachelors') score += 20;
  else score += 10;

  // Experience (40 points)
  if ((data.yearsExperience || 0) >= 5) score += 40;
  else if ((data.yearsExperience || 0) >= 3) score += 30;
  else if ((data.yearsExperience || 0) >= 1) score += 20;
  else score += 10;

  // Languages (20 points)
  const hasEnglish = data.languages?.some(
    (l) => l.language === 'English' && ['Fluent', 'Native'].includes(l.proficiency)
  );
  if (hasEnglish) score += 20;

  // Target country language (10 points)
  const countryLanguages: Record<string, string> = {
    Germany: 'German',
    Netherlands: 'Dutch',
    Canada: 'French',
  };
  const targetLang = countryLanguages[data.targetCountry || ''];
  if (
    targetLang &&
    data.languages?.some((l) => l.language === targetLang)
  ) {
    score += 10;
  }

  return Math.min(score, 100);
};

const identifySkillGaps = (data: AssessmentData) => {
  const gaps: Array<{
    skill: string;
    priority: string;
    reason: string;
  }> = [];

  // Check for common requirements
  if ((data.yearsExperience || 0) < 3) {
    gaps.push({
      skill: 'Professional Experience',
      priority: 'HIGH',
      reason: 'Most positions require 3+ years of experience',
    });
  }

  // Language gaps
  const hasEnglish = data.languages?.some((l) => l.language === 'English');
  if (!hasEnglish) {
    gaps.push({
      skill: 'English Language',
      priority: 'HIGH',
      reason:
        'English proficiency is required for most international positions',
    });
  }

  return gaps;
};

const generateRecommendations = (
  data: AssessmentData,
  score: number
): Array<{
  type: string;
  title: string;
  description: string;
  action: string;
}> => {
  const recommendations: Array<{
    type: string;
    title: string;
    description: string;
    action: string;
  }> = [];

  if (score >= 70) {
    recommendations.push({
      type: 'next_step',
      title: 'Start Applying',
      description:
        'You have a strong profile. Browse curated jobs and start applying.',
      action: 'Browse Jobs',
    });
    recommendations.push({
      type: 'cv',
      title: 'Build Your CV',
      description: 'Create an ATS-optimized CV to increase your chances.',
      action: 'Build CV',
    });
  } else if (score >= 50) {
    recommendations.push({
      type: 'upskill',
      title: 'Build Missing Skills',
      description: 'Take courses to strengthen your profile.',
      action: 'View Courses',
    });
    recommendations.push({
      type: 'cv',
      title: 'Build Your CV',
      description: 'Highlight your existing strengths effectively.',
      action: 'Build CV',
    });
  } else {
    recommendations.push({
      type: 'upskill',
      title: 'Focus on Skills First',
      description: 'Your profile needs strengthening before applying.',
      action: 'View Courses',
    });
  }

  return recommendations;
};
