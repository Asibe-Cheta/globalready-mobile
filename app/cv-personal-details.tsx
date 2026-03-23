import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { getCountryDialCode, resolveCountryName } from '@/data/countryDialCodes';
import { useCVBuilder } from '@/hooks/useCVBuilder';
import { supabase } from '@/lib/supabase';

type PersonalForm = {
  fullName: string;
  country: string;
  phone: string;
  email: string;
  linkedIn: string;
  portfolio: string;
};

const emptyForm: PersonalForm = {
  fullName: '',
  country: '',
  phone: '',
  email: '',
  linkedIn: '',
  portfolio: '',
};

const mergePrefill = (prev: PersonalForm, next: Partial<PersonalForm>) => {
  const merged = { ...prev };
  (Object.keys(next) as Array<keyof PersonalForm>).forEach((key) => {
    const value = next[key];
    if (!merged[key] && value) {
      merged[key] = value;
    }
  });
  return merged;
};

const isSamePersonal = (a: PersonalForm, b?: Record<string, any>) => {
  if (!b) return false;
  return (
    a.fullName === (b.fullName || '') &&
    a.country === (b.country || '') &&
    a.phone === (b.phone || '') &&
    a.email === (b.email || '') &&
    a.linkedIn === (b.linkedIn || '') &&
    a.portfolio === (b.portfolio || '')
  );
};

const getPhonePlaceholder = (country?: string) => {
  if (!country) return '(+1) 555 000 0000';
  const resolved = resolveCountryName(country) || country;
  const dial = getCountryDialCode(resolved) || '+1';
  return `${dial} 555 000 0000`;
};

export default function CvPersonalDetailsScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { assessmentData } = useAssessment();
  const { cvData, updatePersonal, saveDraft, setCurrentStep } = useCVBuilder();
  const [form, setForm] = useState<PersonalForm>(emptyForm);
  const [countryTouched, setCountryTouched] = useState(false);

  const personalDraft = useMemo(() => {
    const personal = cvData.personal || {};
    return {
      fullName: personal.fullName as string,
      country: personal.country as string,
      phone: personal.phone as string,
      email: personal.email as string,
      linkedIn: personal.linkedIn as string,
      portfolio: personal.portfolio as string,
    };
  }, [cvData.personal]);

  useEffect(() => {
    setForm((prev) => {
      const merged = mergePrefill(prev, personalDraft);
      if (merged === prev) return prev;
      if (merged.fullName === prev.fullName &&
          merged.country === prev.country &&
          merged.phone === prev.phone &&
          merged.email === prev.email &&
          merged.linkedIn === prev.linkedIn &&
          merged.portfolio === prev.portfolio) {
        return prev;
      }
      return merged;
    });
  }, [personalDraft]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;

      let profile: any = null;
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        profile = data || null;
      }

      const profileCountry = profile?.country || user?.user_metadata?.country || '';
      const targetCountry = assessmentData?.targetCountry || '';

      const next: Partial<PersonalForm> = {
        fullName:
          profile?.full_name ||
          user?.user_metadata?.full_name ||
          user?.email?.split('@')[0],
        email: profile?.email || user?.email,
        phone: profile?.phone || user?.phone || user?.user_metadata?.phone,
        country: targetCountry || profileCountry,
        linkedIn: profile?.linkedin || user?.user_metadata?.linkedin,
        portfolio: profile?.portfolio || user?.user_metadata?.portfolio,
      };

      if (isMounted) {
        setForm((prev) => {
          const merged = mergePrefill(prev, next);
          if (!countryTouched && targetCountry && merged.country !== targetCountry) {
            return { ...merged, country: targetCountry };
          }
          return merged;
        });
      }
    };

    loadProfile().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [assessmentData?.targetCountry, countryTouched]);

  useEffect(() => {
    if (isSamePersonal(form, cvData.personal)) {
      return;
    }

    updatePersonal({
      fullName: form.fullName,
      country: form.country,
      phone: form.phone,
      email: form.email,
      linkedIn: form.linkedIn,
      portfolio: form.portfolio,
    });
    setCurrentStep(1);
    saveDraft().catch(() => undefined);
  }, [form, cvData.personal, updatePersonal, setCurrentStep, saveDraft]);

  const updateField = (key: keyof PersonalForm, value: string) => {
    if (key === 'country') {
      setCountryTouched(true);
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveProfileDetails = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return;

    await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: form.fullName || user.user_metadata?.full_name || user.email?.split('@')[0],
        email: form.email || user.email,
        phone: form.phone || null,
        country: form.country || null,
        linkedin: form.linkedIn || null,
        portfolio: form.portfolio || null,
      });
  };

  const handleContinue = async () => {
    await saveProfileDetails().catch(() => undefined);
    router.push('/cv-skills-availability');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.stepWrap}>
            <Text style={styles.stepLabel}>Step 1 of 5</Text>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/landing')} accessibilityRole="button">
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Personal Details</Text>
          <Text style={styles.subtitle}>Let's start with the basics.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              placeholder="Jane Doe"
              placeholderTextColor={colors.inputPlaceholder}
              value={form.fullName}
              onChangeText={(value) => updateField('fullName', value)}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Country of residence</Text>
            <TextInput
              style={styles.input}
              placeholder="Select Country"
              placeholderTextColor={colors.inputPlaceholder}
              value={form.country}
              onChangeText={(value) => updateField('country', value)}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone number</Text>
            <TextInput
              style={styles.input}
              placeholder={getPhonePlaceholder(form.country)}
              placeholderTextColor={colors.inputPlaceholder}
              value={form.phone}
              onChangeText={(value) => updateField('phone', value)}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="jane@example.com"
              placeholderTextColor={colors.inputPlaceholder}
              value={form.email}
              onChangeText={(value) => updateField('email', value)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>LinkedIn profile</Text>
            <TextInput
              style={styles.input}
              placeholder="linkedin.com/in/janedoe"
              placeholderTextColor={colors.inputPlaceholder}
              value={form.linkedIn}
              onChangeText={(value) => updateField('linkedIn', value)}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Portfolio link</Text>
            <TextInput
              style={styles.input}
              placeholder="janedoe.com"
              placeholderTextColor={colors.inputPlaceholder}
              value={form.portfolio}
              onChangeText={(value) => updateField('portfolio', value)}
              autoCapitalize="none"
            />
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <PrimaryButton label="Continue" icon="arrow-forward" onPress={handleContinue} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.background,
  },
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  stepWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  stepLabel: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    width: '70%',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '20%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: c.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 160,
  },
  title: {
    color: c.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 14,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: c.surface,
    color: c.textPrimary,
    paddingHorizontal: 14,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: c.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
