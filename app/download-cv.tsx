import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { theme } from '@/constants/globalready-theme';
import { AppHeader } from '@/components/ui/app-header';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ProSuggestionModal } from '@/components/ProSuggestionModal';
import { Screen } from '@/components/ui/screen';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useProPrompt } from '@/hooks/useProPrompt';
import { supabase } from '@/lib/supabase';
import { sendCvDownloadEmail } from '@/services/email/sendgrid';
import { buildCVHtml, type CVData } from '@/utils/cvHtml';

export default function DownloadCvScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const cvId = params.cvId as string;

  const [cvData, setCvData] = useState<CVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const hasSentEmail = useRef(false);
  const { isPro } = useSubscription();
  const { shouldShowProPrompt, markProPromptShown } = useProPrompt();

  const userName = cvData?.personal?.fullName || 'CV';
  const safeFileName = userName.replace(/[^a-zA-Z0-9]/g, '_') + '_CV_Global';

  useEffect(() => {
    loadCVData();
  }, []);

  const loadCVData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Try loading by cvId first, then fall back to most recent CV
      let cvRow: any = null;
      if (cvId) {
        const { data } = await supabase
          .from('cvs')
          .select('cv_data')
          .eq('id', cvId)
          .single();
        cvRow = data;
      }

      if (!cvRow) {
        const { data } = await supabase
          .from('cvs')
          .select('cv_data')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        cvRow = data;
      }

      if (cvRow?.cv_data) {
        setCvData(cvRow.cv_data as CVData);
      } else {
        // Fallback: try cached tailored result from AsyncStorage
        const cached = await AsyncStorage.getItem('gr_tailored_cv_result');
        if (cached) {
          const { tailored } = JSON.parse(cached);
          if (tailored) setCvData(tailored as CVData);
        }
      }

      // Send download-ready email once
      if (!hasSentEmail.current && user.email) {
        hasSentEmail.current = true;
        sendCvDownloadEmail(user.email, cvId).catch(() => undefined);
      }
    } catch (error) {
      console.error('Failed to load CV data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cvData) {
      Alert.alert('No CV Data', 'Could not find your CV data. Please try building your CV again.');
      return;
    }

    // Free users: gate second download
    if (!isPro) {
      const used = await AsyncStorage.getItem('gr_free_cv_downloaded');
      if (used === 'true') {
        setShowProModal(true);
        return;
      }
    }

    setGenerating(true);
    try {
      const html = buildCVHtml(cvData);
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${safeFileName}.pdf`,
          UTI: 'com.adobe.pdf',
        });
        setDownloaded(true);
        if (!isPro) {
          // Mark free download as used
          await AsyncStorage.setItem('gr_free_cv_downloaded', 'true');
          shouldShowProPrompt('pro_after_download').then((show) => {
            if (show) setShowProModal(true);
          });
        }
      } else {
        Alert.alert('PDF Generated', 'Your CV PDF has been generated but sharing is not available on this device.');
      }
    } catch (error: any) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Download CV" onBack={router.back} />

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your CV...</Text>
          </View>
        ) : (
          <>
            <View style={styles.successWrap}>
              <View style={styles.successGlow} />
              <View style={styles.successIcon}>
                <MaterialIcons name={downloaded ? 'check-circle' : 'description'} size={54} color={colors.primary} />
                <View style={styles.successBadge}>
                  <MaterialIcons name="flight-takeoff" size={16} color="#22c55e" />
                </View>
              </View>
            </View>

            <View style={styles.textBlock}>
              <Text style={styles.title}>
                {downloaded ? 'CV Downloaded!' : 'Your CV is ready!'}
              </Text>
              <Text style={styles.subtitle}>
                {downloaded
                  ? 'Discover curated job offers in various countries on our Job Board.'
                  : 'Tap the button below to generate and download your professional CV as a PDF.'}
              </Text>
            </View>

            {cvData ? (
              <View style={styles.fileCard}>
                <View style={styles.fileIcon}>
                  <MaterialIcons name="picture-as-pdf" size={30} color="#ef4444" />
                </View>
                <View style={styles.fileContent}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {safeFileName}.pdf
                  </Text>
                  <View style={styles.fileMetaRow}>
                    <Text style={styles.fileMeta}>PDF DOCUMENT</Text>
                    <View style={styles.metaDot} />
                    <Text style={styles.fileMeta}>
                      {cvData.experience?.length || 0} exp | {cvData.education?.length || 0} edu | {cvData.skills?.length || 0} skills
                    </Text>
                  </View>
                </View>
                {downloaded && <MaterialIcons name="check" size={22} color={colors.primary} />}
              </View>
            ) : (
              <View style={styles.fileCard}>
                <View style={styles.fileIcon}>
                  <MaterialIcons name="warning" size={30} color="#f59e0b" />
                </View>
                <View style={styles.fileContent}>
                  <Text style={styles.fileName}>No CV data found</Text>
                  <Text style={[styles.fileMeta, { marginTop: 4 }]}>Please build your CV first</Text>
                </View>
              </View>
            )}

            {cvData && !downloaded && (
              <TouchableOpacity
                style={styles.previewCard}
                onPress={handleDownload}
                disabled={generating}
                accessibilityRole="button"
              >
                <View style={styles.previewFooter}>
                  <MaterialIcons name="visibility" size={16} color={colors.textSecondary} />
                  <Text style={styles.previewText}>
                    {generating ? 'Generating PDF...' : 'Tap to preview & save'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      <View style={styles.bottomBar}>
        {!downloaded ? (
          <PrimaryButton
            label={generating ? 'Generating PDF...' : 'Download CV as PDF'}
            icon={generating ? undefined : 'download'}
            onPress={handleDownload}
            disabled={generating || loading || !cvData}
          />
        ) : (
          <PrimaryButton
            label="Check out our Job board"
            icon="work"
            onPress={() => router.push('/jobs-feed')}
          />
        )}
        <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/landing')} accessibilityRole="button">
          <MaterialIcons name="home" size={16} color={colors.textSecondary} />
          <Text style={styles.homeButtonText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>

      <ProSuggestionModal
        visible={showProModal}
        message="Unlock everything you need to get job-ready faster. Pro includes unlimited CV downloads, AI tailoring, and full job listings."
        onSeePro={() => router.push('/billing')}
        onDismiss={() => {
          setShowProModal(false);
          markProPromptShown('pro_after_download');
        }}
      />
    </Screen>
  );
}

const colors = theme.colors;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  loadingWrap: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  successWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(13,108,242,0.2)',
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(13,108,242,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13,108,242,0.3)',
  },
  successBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textBlock: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  fileIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileContent: {
    flex: 1,
  },
  fileName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  fileMeta: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textSecondary,
  },
  previewCard: {
    width: '100%',
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
  },
  previewText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: colors.background,
    gap: 10,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  homeButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
