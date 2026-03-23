import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Clipboard,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { theme } from '@/constants/globalready-theme';
import { useCVUpload } from '@/hooks/useCVUpload';
import { loadTailorCvDraft, saveTailorCvDraft } from '@/services/storage/progress';

export default function TailorJobInputScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    jobId: string;
    jobTitle: string;
    company: string;
    description: string;
  }>();
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const { pickDocument, uploading, fileName, error: uploadError, uploadedCvId } = useCVUpload();

  useEffect(() => {
    const loadDraft = async () => {
      // Prefer route params over draft
      if (params.jobTitle || params.description) {
        if (params.jobTitle) setJobTitle(params.jobTitle);
        if (params.description) setJobDescription(params.description);
      } else {
        const draft = await loadTailorCvDraft();
        if (draft?.job_title) setJobTitle(draft.job_title);
        if (draft?.job_description) setJobDescription(draft.job_description);
      }
      await saveTailorCvDraft({ last_route: '/tailor-job-input' });
    };

    loadDraft().catch(() => undefined);
  }, []);

  useEffect(() => {
    saveTailorCvDraft({
      last_route: '/tailor-job-input',
      job_title: jobTitle,
      job_description: jobDescription,
    }).catch(() => undefined);
  }, [jobTitle, jobDescription]);

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getString();
      if (text) setJobDescription(text);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tailor to Job</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/landing')}
            accessibilityRole="button"
          >
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your CV</Text>

            {uploadedCvId ? (
              <View style={[styles.uploadCard, styles.uploadCardSuccess]}>
                <View style={[styles.uploadIconWrap, styles.uploadIconSuccess]}>
                  <MaterialIcons name="check-circle" size={28} color="#10b981" />
                </View>
                <Text style={styles.uploadTitle}>{fileName}</Text>
                <Text style={styles.uploadSubtitleSuccess}>CV uploaded and parsed successfully</Text>
                <TouchableOpacity style={styles.browseButton} onPress={pickDocument}>
                  <Text style={styles.browseButtonText}>Change File</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadCard}>
                {uploading ? (
                  <>
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 12 }} />
                    <Text style={styles.uploadTitle}>Uploading & parsing...</Text>
                    <Text style={styles.uploadSubtitle}>{fileName}</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.uploadIconWrap}>
                      <MaterialIcons name="cloud-upload" size={28} color={colors.primary} />
                    </View>
                    <Text style={styles.uploadTitle}>Upload CV</Text>
                    <Text style={styles.uploadSubtitle}>
                      Upload your most recent or best CV (PDF)
                    </Text>
                    <TouchableOpacity
                      style={styles.browseButton}
                      accessibilityRole="button"
                      onPress={pickDocument}
                    >
                      <Text style={styles.browseButtonText}>Browse Files</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {uploadError ? (
              <Text style={styles.errorText}>{uploadError}</Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Details</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Job Title (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Senior Product Designer"
                placeholderTextColor={colors.textSecondary}
                value={jobTitle}
                onChangeText={setJobTitle}
              />
            </View>


            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Job Description</Text>
              <View style={styles.textareaWrap}>
                <TextInput
                  style={styles.textarea}
                  placeholder="Paste the full job description here..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  textAlignVertical="top"
                  value={jobDescription}
                  onChangeText={setJobDescription}
                />
                <TouchableOpacity style={styles.pasteButton} onPress={handlePaste} accessibilityRole="button">
                  <MaterialIcons name="content-paste" size={16} color={colors.textPrimary} />
                  <Text style={styles.pasteButtonText}>Paste</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <View style={styles.atsRow}>
            <MaterialIcons name="check-circle" size={16} color={colors.success} />
            <Text style={styles.atsText}>ATS Optimized Output</Text>
          </View>
          <PrimaryButton
            label={uploadedCvId ? 'Generate Match Report' : 'Upload CV to continue'}
            icon="auto-awesome"
            disabled={!uploadedCvId}
            onPress={async () => {
              await saveTailorCvDraft({
                last_route: '/job-match-analyzing',
                job_title: jobTitle,
                job_description: jobDescription,
              });
              router.push({
                pathname: '/job-match-analyzing',
                params: { next: '/job-match-report' },
              });
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const colors = theme.colors;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 160,
    paddingTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  uploadCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(148,163,184,0.5)',
    borderRadius: 16,
    backgroundColor: colors.surface,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  uploadCardSuccess: {
    borderColor: 'rgba(16,185,129,0.4)',
    borderStyle: 'solid',
    backgroundColor: 'rgba(16,185,129,0.06)',
  },
  uploadIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(13,108,242,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadIconSuccess: {
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  uploadTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  uploadSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  uploadSubtitleSuccess: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  browseButton: {
    backgroundColor: 'rgba(148,163,184,0.2)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  browseButtonText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 8,
    color: '#f87171',
    fontSize: 12,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: 'rgba(226,232,240,0.9)',
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    paddingHorizontal: 14,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 999,
    padding: 4,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#ffffff',
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentActiveText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  textareaWrap: {
    position: 'relative',
  },
  textarea: {
    minHeight: 200,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  pasteButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(148,163,184,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
  },
  pasteButtonText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  atsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  atsText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
