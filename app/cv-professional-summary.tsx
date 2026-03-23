import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { useCVBuilder } from '@/hooks/useCVBuilder';
import { generateProfessionalSummary } from '@/services/ai/professionalSummary';

export default function CvProfessionalSummaryScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [summary, setSummary] = useState('');
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams<{ cvId?: string }>();
  const { cvData, updateSummary, saveDraft, saveToDatabase } = useCVBuilder();

  // Load existing summary if available
  useEffect(() => {
    if (cvData.summary) {
      setSummary(cvData.summary);
    }
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const { summary: generated } = await generateProfessionalSummary({ cvData });

      if (!generated) {
        Alert.alert('No summary generated', 'Try again or write your own summary.');
        return;
      }

      setSummary(generated);
      updateSummary(generated);
    } catch (error) {
      console.error('Generate summary error:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to reach the AI service. Please try again.';
      Alert.alert('Generation failed', message);
    } finally {
      setGenerating(false);
    }
  };

  const handleContinue = async () => {
    if (summary.trim()) {
      updateSummary(summary.trim());
    }

    try {
      const saved = await saveToDatabase();
      router.push({
        pathname: '/tailored-cv-preview',
        params: { cvId: saved?.id || params.cvId || '', fromWorkAbroad: '1' },
      });
    } catch {
      router.push({
        pathname: '/tailored-cv-preview',
        params: { cvId: params.cvId || '', fromWorkAbroad: '1' },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Professional Summary</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/landing')} accessibilityRole="button">
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressRow}>
            <Text style={styles.progressStep}>Final Step</Text>
            <Text style={styles.progressPercent}>90%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Professional Summary</Text>
          <Text style={styles.subtitle}>
            A strong summary helps recruiters understand your value in seconds.
          </Text>

          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <MaterialIcons name="auto-awesome" size={20} color={colors.primary} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>AI-Powered</Text>
              <Text style={styles.tipText}>
                Generate a professional summary based on your experience, skills, and education. You can edit it afterwards.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.generateButton, generating && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={generating}
            accessibilityRole="button"
          >
            {generating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="auto-awesome" size={20} color="#fff" />
            )}
            <Text style={styles.generateButtonText}>
              {generating ? 'Generating...' : summary ? 'Regenerate Summary' : 'Generate with AI'}
            </Text>
          </TouchableOpacity>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Your Summary</Text>
              {summary ? (
                <Text style={styles.charCount}>{summary.length} chars</Text>
              ) : null}
            </View>
            <TextInput
              style={styles.textarea}
              placeholder="Your professional summary will appear here. You can also write or edit it manually."
              placeholderTextColor={colors.inputPlaceholder}
              multiline
              textAlignVertical="top"
              value={summary}
              onChangeText={(text) => {
                setSummary(text);
                updateSummary(text);
              }}
            />
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <PrimaryButton
            label="Save & Continue"
            icon="arrow-forward"
            onPress={handleContinue}
            disabled={generating}
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  progressWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressStep: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressPercent: {
    color: c.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '90%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: c.primary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 200,
  },
  title: {
    color: c.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  tipCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 20,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13,108,242,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipText: {
    color: c.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: c.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  label: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  charCount: {
    color: c.textSecondary,
    fontSize: 11,
  },
  textarea: {
    minHeight: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: c.surface,
    color: c.textPrimary,
    paddingHorizontal: 14,
    paddingTop: 14,
    fontSize: 14,
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: c.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
