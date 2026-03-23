import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';

type CvStatusOption = 'needs_cv' | 'has_cv';
type CvPurposeOption = 'job_seeking' | 'other';

export default function CvStatusQuestionnaireScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const [cvStatus, setCvStatus] = useState<CvStatusOption>('needs_cv');
  const [cvPurpose, setCvPurpose] = useState<CvPurposeOption>('job_seeking');

  const handleContinue = () => {
    if (cvStatus === 'has_cv') {
      router.push('/jobs-feed');
      return;
    }
    router.push('/assessment-targeting');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GlobalReady</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/landing')} accessibilityRole="button">
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>CV Status & Goal Questionnaire</Text>
          <Text style={styles.subtitle}>
            Choose the options that best describe your situation so we can guide you correctly.
          </Text>

          <Text style={styles.sectionTitle}>Do you have a professional CV?</Text>
          <View style={styles.optionList}>
            <TouchableOpacity
              style={[styles.optionCard, cvStatus === 'needs_cv' && styles.optionCardSelected]}
              onPress={() => setCvStatus('needs_cv')}
              accessibilityRole="button"
            >
              <View style={[styles.optionIcon, cvStatus === 'needs_cv' && styles.optionIconSelected]}>
                <MaterialIcons name="note-add" size={20} color={cvStatus === 'needs_cv' ? '#fff' : colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>No, I need a new one</Text>
                <Text style={styles.optionSubtitle}>We'll help you build a professional, ATS-friendly CV.</Text>
              </View>
              <View style={[styles.radioOuter, cvStatus === 'needs_cv' && styles.radioOuterSelected]}>
                {cvStatus === 'needs_cv' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionCard, cvStatus === 'has_cv' && styles.optionCardSelected]}
              onPress={() => setCvStatus('has_cv')}
              accessibilityRole="button"
            >
              <View style={[styles.optionIcon, cvStatus === 'has_cv' && styles.optionIconSelected]}>
                <MaterialIcons name="task-alt" size={20} color={cvStatus === 'has_cv' ? '#fff' : colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Yes, I already have one</Text>
                <Text style={styles.optionSubtitle}>We'll help you find jobs and tailor your CV.</Text>
              </View>
              <View style={[styles.radioOuter, cvStatus === 'has_cv' && styles.radioOuterSelected]}>
                {cvStatus === 'has_cv' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>For what purpose do you need a CV?</Text>
          <View style={styles.optionList}>
            <TouchableOpacity
              style={[styles.optionCard, cvPurpose === 'job_seeking' && styles.optionCardSelected]}
              onPress={() => setCvPurpose('job_seeking')}
              accessibilityRole="button"
            >
              <View style={[styles.optionIcon, cvPurpose === 'job_seeking' && styles.optionIconSelected]}>
                <MaterialIcons name="public" size={20} color={cvPurpose === 'job_seeking' ? '#fff' : colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Job seeking abroad</Text>
                <Text style={styles.optionSubtitle}>Tailor your CV for international markets.</Text>
              </View>
              <View style={[styles.radioOuter, cvPurpose === 'job_seeking' && styles.radioOuterSelected]}>
                {cvPurpose === 'job_seeking' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionCard, cvPurpose === 'other' && styles.optionCardSelected]}
              onPress={() => setCvPurpose('other')}
              accessibilityRole="button"
            >
              <View style={[styles.optionIcon, cvPurpose === 'other' && styles.optionIconSelected]}>
                <MaterialIcons name="school" size={20} color={cvPurpose === 'other' ? '#fff' : colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Other reasons</Text>
                <Text style={styles.optionSubtitle}>General career growth or academic purposes.</Text>
              </View>
              <View style={[styles.radioOuter, cvPurpose === 'other' && styles.radioOuterSelected]}>
                {cvPurpose === 'other' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <PrimaryButton
            label="Continue"
            icon="arrow-forward"
            onPress={handleContinue}
          />
        </View>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 160,
  },
  title: {
    color: c.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  optionList: {
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  optionCardSelected: {
    borderColor: c.primary,
    backgroundColor: 'rgba(13,108,242,0.1)',
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(13,108,242,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: c.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionSubtitle: {
    color: c.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(148,163,184,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: c.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: c.primary,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: c.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
