import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { useAssessment } from '@/contexts/AssessmentContext';

const languageOptions = ['English', 'French', 'German', 'Other'];
const historyOptions = [
  {
    value: 'no-replies',
    title: 'Yes, no replies',
    description: 'I sent applications but heard nothing back',
  },
  {
    value: 'rejections',
    title: 'Yes, rejections',
    description: 'I received interview invites or rejection emails',
  },
  {
    value: 'not-yet',
    title: 'No, not yet',
    description: 'I am just starting my journey',
  },
];

export default function AssessmentLanguageScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { assessmentData, updateAssessment, nextStep, saveDraft } = useAssessment();

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    assessmentData.languages?.map((l) => l.language) || ['English']
  );
  const [applicationHistory, setApplicationHistory] = useState<string | undefined>(
    assessmentData.applicationHistory
  );

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter((item) => item !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const handleContinue = async () => {
    if (selectedLanguages.length === 0 || !applicationHistory) {
      Alert.alert('Error', 'Please complete all fields');
      return;
    }

    const languages = selectedLanguages.map((language) => ({
      language,
      proficiency: language === 'English' ? 'Fluent' : 'Basic',
    }));
    updateAssessment({
      languages,
      applicationHistory,
      hasAppliedBefore: applicationHistory !== 'not-yet',
    });
    await saveDraft('/reality-feedback');
    nextStep();
    router.push('/reality-feedback');
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={router.back}>
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Work Abroad Path</Text>
          <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/landing')}>
            <MaterialIcons name="home" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <Text style={styles.stepText}>Step 3 of 5</Text>
              <Text style={styles.stepPercent}>60%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>

          <Text style={styles.kicker}>Work Abroad Assessment</Text>
          <Text style={styles.title}>Language & History</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Which language can you work in?</Text>
            <View style={styles.chipWrap}>
              {languageOptions.map((language) => {
                const active = selectedLanguages.includes(language);
                return (
                  <TouchableOpacity
                    key={language}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggleLanguage(language)}
                  >
                    {active && (
                      <MaterialIcons name="check" size={16} color="#fff" />
                    )}
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {language}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Have you applied for jobs abroad before?</Text>
            <View style={styles.optionList}>
              {historyOptions.map((option) => {
                const active = applicationHistory === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.optionCard, active && styles.optionCardActive]}
                    onPress={() => setApplicationHistory(option.value)}
                  >
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text style={styles.optionSubtitle}>{option.description}</Text>
                    </View>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <MaterialIcons name="check" size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cta} onPress={handleContinue}>
            <Text style={styles.ctaText}>Get My Assessment</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  progressBlock: {
    gap: 8,
    marginTop: 8,
    marginBottom: 18,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepText: {
    color: c.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  stepPercent: {
    color: c.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: c.surfaceAlt,
  },
  progressFill: {
    height: '100%',
    width: '60%',
    borderRadius: 999,
    backgroundColor: c.primary,
  },
  kicker: {
    color: c.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: c.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 16,
  },
  section: {
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: c.surface,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  chipText: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
  },
  optionList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  optionCardActive: {
    borderColor: c.primary,
    backgroundColor: 'rgba(13,108,242,0.1)',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  optionSubtitle: {
    color: c.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: c.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    paddingBottom: 28,
    backgroundColor: 'rgba(16,24,35,0.94)',
  },
  cta: {
    height: 56,
    borderRadius: 999,
    backgroundColor: c.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
