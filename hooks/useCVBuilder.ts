import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface CVData {
  personal: Record<string, any>;
  experience: any[];
  education: any[];
  skills: string[];
  languages: any[];
  certifications: any[];
  summary?: string;
}

export const useCVBuilder = () => {
  const [cvData, setCVData] = useState<CVData>({
    personal: {},
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftExists, setDraftExists] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft from AsyncStorage
  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    try {
      const draft = await AsyncStorage.getItem('cv_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        setCVData(parsed.data);
        setCurrentStep(parsed.currentStep || 1);
        setDraftExists(true);
      } else {
        setDraftExists(false);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      setDraftExists(false);
    } finally {
      setDraftLoaded(true);
    }
  };

  // Auto-save draft (call this every 30 seconds or on field change)
  const saveDraft = useCallback(async () => {
    try {
      const draft = {
        data: cvData,
        currentStep,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem('cv_draft', JSON.stringify(draft));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [cvData, currentStep]);

  // Debounced auto-save on any CV data change
  useEffect(() => {
    if (!draftLoaded) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveDraft().catch(() => undefined);
    }, 400);
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [cvData, currentStep, draftLoaded, saveDraft]);

  // Save to Supabase
  const saveToDatabase = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('cvs')
        .insert({
          user_id: user.id,
          type: 'built',
          cv_data: cvData,
          payment_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Clear draft after successful save
      await AsyncStorage.removeItem('cv_draft');

      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePersonal = (data: any) => {
    setCVData(prev => ({
      ...prev,
      personal: {
        ...(prev.personal || {}),
        ...(data || {}),
      },
    }));
  };

  const addExperience = (exp: any) => {
    setCVData(prev => ({ 
      ...prev, 
      experience: [...prev.experience, exp] 
    }));
  };

  const updateExperience = (index: number, exp: any) => {
    setCVData(prev => {
      const newExp = [...prev.experience];
      newExp[index] = exp;
      return { ...prev, experience: newExp };
    });
  };

  const removeExperience = (index: number) => {
    setCVData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const addEducation = (edu: any) => {
    setCVData(prev => ({ 
      ...prev, 
      education: [...prev.education, edu] 
    }));
  };

  const updateEducation = (index: number, edu: any) => {
    setCVData(prev => {
      const newEdu = [...prev.education];
      newEdu[index] = edu;
      return { ...prev, education: newEdu };
    });
  };

  const removeEducation = (index: number) => {
    setCVData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const updateSkills = (skills: string[]) => {
    setCVData(prev => ({ ...prev, skills }));
  };

  const addLanguage = (lang: any) => {
    setCVData(prev => ({ 
      ...prev, 
      languages: [...prev.languages, lang] 
    }));
  };

  const updateLanguage = (index: number, lang: any) => {
    setCVData(prev => {
      const newLangs = [...prev.languages];
      newLangs[index] = lang;
      return { ...prev, languages: newLangs };
    });
  };

  const removeLanguage = (index: number) => {
    setCVData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
    }));
  };

  const addCertification = (cert: any) => {
    setCVData(prev => ({ 
      ...prev, 
      certifications: [...prev.certifications, cert] 
    }));
  };

  const updateCertification = (index: number, cert: any) => {
    setCVData(prev => {
      const newCerts = [...prev.certifications];
      newCerts[index] = cert;
      return { ...prev, certifications: newCerts };
    });
  };

  const removeCertification = (index: number) => {
    setCVData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const updateSummary = (summary: string) => {
    setCVData(prev => ({ ...prev, summary }));
  };

  return {
    cvData,
    currentStep,
    loading,
    draftLoaded,
    draftExists,
    setCurrentStep,
    updatePersonal,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    updateSkills,
    addLanguage,
    updateLanguage,
    removeLanguage,
    addCertification,
    updateCertification,
    removeCertification,
    updateSummary,
    saveDraft,
    saveToDatabase,
  };
};
