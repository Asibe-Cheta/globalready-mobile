import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { useCVUpload } from '@/hooks/useCVUpload';
import { saveTailorCvDraft } from '@/services/storage/progress';

export default function ConfirmJobCvScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const { jobId, jobTitle, company, description } = useLocalSearchParams<{
    jobId: string;
    jobTitle: string;
    company: string;
    description: string;
  }>();
  const { pickDocument, uploading, fileName, error: uploadError, uploadedCvId } = useCVUpload();

  const displayTitle = jobTitle || 'Job Position';
  const displayCompany = company || 'Company';
  const displayDescription = description || '';

  const handleContinue = async () => {
    // Save job description to tailor_cv_draft so job-match-analyzing can read it
    await saveTailorCvDraft({
      last_route: '/job-fit-analysis',
      job_title: displayTitle,
      job_description: displayDescription,
    });

    router.push({
      pathname: '/job-fit-analysis',
      params: {
        jobId: jobId || '',
        jobTitle: displayTitle,
        company: displayCompany,
        description: displayDescription,
      },
    });
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Job & CV</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroImage} />
            <View style={styles.heroBadge}>
              <MaterialIcons name="check-circle" size={12} color="#fff" />
              <Text style={styles.heroBadgeText}>JOB DETAILS AUTO-LOADED</Text>
            </View>
            <Text style={styles.heroLabel}>Target Job</Text>
            <Text style={styles.heroTitle}>{displayTitle}</Text>
            <View style={styles.heroCompanyRow}>
              <MaterialIcons name="domain" size={16} color={colors.textSecondary} />
              <Text style={styles.heroCompany}>{displayCompany}</Text>
            </View>
            {displayDescription ? (
              <Text style={styles.heroDescription} numberOfLines={3}>
                {displayDescription}
              </Text>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>Step 1: Upload your CV</Text>

          {uploadedCvId ? (
            <View style={[styles.uploadCard, styles.uploadCardSuccess]}>
              <View style={[styles.uploadIcon, styles.uploadIconSuccess]}>
                <MaterialIcons name="check-circle" size={28} color="#10b981" />
              </View>
              <Text style={styles.uploadTitle}>{fileName}</Text>
              <Text style={styles.uploadSubtitleSuccess}>CV uploaded successfully</Text>
              <TouchableOpacity style={styles.changeButton} onPress={pickDocument}>
                <Text style={styles.changeButtonText}>Change File</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadCard}
              accessibilityRole="button"
              onPress={pickDocument}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.uploadTitle}>Uploading...</Text>
                  <Text style={styles.uploadSubtitle}>{fileName}</Text>
                </>
              ) : (
                <>
                  <View style={styles.uploadIcon}>
                    <MaterialIcons name="cloud-upload" size={28} color={colors.primary} />
                  </View>
                  <Text style={styles.uploadTitle}>Tap to upload your current CV</Text>
                  <Text style={styles.uploadSubtitle}>(PDF)</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {uploadError ? (
            <Text style={styles.errorText}>{uploadError}</Text>
          ) : null}

          <Text style={styles.note}>
            GlobalReady will use your CV to tailor your profile specifically for the {displayTitle} role
            at {displayCompany}.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, !uploadedCvId && styles.primaryButtonDisabled]}
            onPress={handleContinue}
            disabled={!uploadedCvId}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              {uploadedCvId ? 'Continue with this job' : 'Upload your CV to continue'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/cv-builder-offer')}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Don't have a CV yet? Create my CV</Text>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 160,
  },
  heroCard: {
    borderRadius: 18,
    padding: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: c.surface,
    gap: 8,
    overflow: 'hidden',
  },
  heroImage: {
    height: 180,
    backgroundColor: '#0f172a',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(16,185,129,0.9)',
    position: 'absolute',
    top: 12,
    right: 12,
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  heroLabel: {
    color: c.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingTop: 14,
    paddingHorizontal: 16,
  },
  heroTitle: {
    color: c.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: 16,
  },
  heroCompanyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  heroCompany: {
    color: c.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  heroDescription: {
    color: c.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    marginTop: 20,
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  uploadCard: {
    marginTop: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(148,163,184,0.3)',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  uploadCardSuccess: {
    borderColor: 'rgba(16,185,129,0.4)',
    borderStyle: 'solid',
    backgroundColor: 'rgba(16,185,129,0.06)',
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(13,108,242,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconSuccess: {
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  uploadTitle: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  uploadSubtitle: {
    color: c.textSecondary,
    fontSize: 12,
  },
  uploadSubtitleSuccess: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  changeButton: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.2)',
  },
  changeButtonText: {
    color: c.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 8,
    color: '#f87171',
    fontSize: 12,
  },
  note: {
    marginTop: 12,
    color: c.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    gap: 12,
  },
  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: c.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 54,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: c.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
