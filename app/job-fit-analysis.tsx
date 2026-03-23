import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { saveTailorCvDraft } from '@/services/storage/progress';

export default function JobFitAnalysisScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const { jobId, jobTitle, company, description } = useLocalSearchParams<{
    jobId: string;
    jobTitle: string;
    company: string;
    description: string;
  }>();

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Fit Analysis</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="info" size={40} color={colors.primary} />
          </View>
          <Text style={styles.title}>Important Note</Text>
          <Text style={styles.subtitle}>
            This step analyzes if you are a fit for the job based on your current CV.{' '}
            <Text style={styles.subtitleStrong}>It does not tailor your CV yet.</Text>
          </Text>

          <View style={styles.callout}>
            <MaterialIcons name="tips-and-updates" size={20} color={colors.primary} />
            <Text style={styles.calloutText}>
              Remember, you still need to tailor your CV specifically for this role to stand a better
              chance of being invited for an interview.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={async () => {
              // Save job description to draft so job-match-analyzing can read it
              if (description) {
                await saveTailorCvDraft({
                  last_route: '/job-match-analyzing',
                  job_title: jobTitle || '',
                  job_description: description,
                });
              }
              router.push('/job-match-analyzing');
            }}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Check my job fit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(13,108,242,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: c.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  subtitleStrong: {
    color: c.textPrimary,
    fontWeight: '700',
  },
  callout: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(13,108,242,0.2)',
    backgroundColor: 'rgba(13,108,242,0.08)',
    padding: 16,
  },
  calloutText: {
    flex: 1,
    color: c.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  primaryButton: {
    height: 60,
    borderRadius: 14,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: c.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
