import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { LoadingState } from '@/components/LoadingState';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ProSuggestionModal } from '@/components/ProSuggestionModal';
import { theme } from '@/constants/globalready-theme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useProPrompt } from '@/hooks/useProPrompt';
import { CVData } from '@/hooks/useCVBuilder';
import { supabase } from '@/lib/supabase';
import { saveTailorCvDraft } from '@/services/storage/progress';

interface TailoredResult {
  original: CVData;
  tailored: CVData;
  cvId: string;
  jobDescription: string;
}

interface Improvement {
  title: string;
  subtitle: string;
}

const computeImprovements = (original: CVData, tailored: CVData, jobDescription: string): Improvement[] => {
  const improvements: Improvement[] = [];

  // Check if summary was enhanced
  if (tailored.summary && tailored.summary !== original.summary) {
    improvements.push({
      title: 'Professional summary optimized',
      subtitle: 'Rewritten to align with job requirements',
    });
  }

  // Check for new/changed skills
  const origSkills = new Set(original.skills?.map((s) => s.toLowerCase()) ?? []);
  const newSkills = (tailored.skills ?? []).filter((s) => !origSkills.has(s.toLowerCase()));
  if (newSkills.length > 0) {
    improvements.push({
      title: `${newSkills.length} job-specific keyword${newSkills.length > 1 ? 's' : ''} added`,
      subtitle: 'Matched with job description',
    });
  }

  // Check if skills were reordered
  if (
    tailored.skills?.length &&
    original.skills?.length &&
    JSON.stringify(tailored.skills) !== JSON.stringify(original.skills) &&
    newSkills.length === 0
  ) {
    improvements.push({
      title: 'Skills alignment',
      subtitle: 'Highlighted top matching skills',
    });
  }

  // Check experience changes
  const origExpStr = JSON.stringify(original.experience ?? []);
  const tailoredExpStr = JSON.stringify(tailored.experience ?? []);
  if (tailoredExpStr !== origExpStr) {
    improvements.push({
      title: 'Experience reworded',
      subtitle: 'Most relevant roles & achievements prioritized',
    });
  }

  // ATS compatibility is always added since we optimized
  improvements.push({
    title: 'ATS compatibility',
    subtitle: 'Optimized for scanning systems',
  });

  return improvements;
};

const computeATSScore = (tailored: CVData, jobDescription: string): number => {
  if (!jobDescription) return 0;
  const jdWords = jobDescription
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);
  const uniqueJdWords = [...new Set(jdWords)];
  if (uniqueJdWords.length === 0) return 75;

  const cvText = [
    tailored.summary ?? '',
    ...(tailored.skills ?? []),
    ...(tailored.experience ?? []).flatMap((e: any) => [
      e.jobTitle ?? '',
      e.company ?? '',
      ...(e.responsibilities ?? []),
    ]),
    ...(tailored.education ?? []).map((e: any) => `${e.degree} ${e.fieldOfStudy} ${e.institution}`),
  ]
    .join(' ')
    .toLowerCase();

  let matchCount = 0;
  for (const word of uniqueJdWords) {
    if (cvText.includes(word)) matchCount++;
  }

  const rawScore = Math.round((matchCount / uniqueJdWords.length) * 100);
  // Floor at 40, cap at 99
  return Math.min(99, Math.max(40, rawScore));
};

export default function TailoredCvPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const cvId = (params.cvId as string) || '';
  const jobDescription = params.jobDescription as string;
  const fromWorkAbroad = params.fromWorkAbroad === '1' || params.fromWorkAbroad === 'true';

  const { isPro } = useSubscription();
  const { shouldShowProPrompt, markProPromptShown } = useProPrompt();
  const [result, setResult] = useState<TailoredResult | null>(null);
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [atsScore, setAtsScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  useEffect(() => {
    saveTailorCvDraft({ last_route: '/tailored-cv-preview' }).catch(() => undefined);

    AsyncStorage.getItem('gr_tailored_cv_result')
      .then((raw) => {
        if (raw) {
          const parsed: TailoredResult = JSON.parse(raw);
          setResult(parsed);
          const jd = jobDescription || parsed.jobDescription || '';
          setImprovements(computeImprovements(parsed.original, parsed.tailored, jd));
          setAtsScore(computeATSScore(parsed.tailored, jd));
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || isPro) return;
    shouldShowProPrompt('pro_tailor_preview').then((show) => {
      if (show) setShowProModal(true);
    });
  }, [loading, isPro, shouldShowProPrompt]);

  if (loading) return <LoadingState message="Loading preview..." />;

  const finalCvId = cvId || result?.cvId || '';
  // Only use URL param — not stored result — to determine if this is a tailoring session
  const isTailoringMode = !!jobDescription;
  const finalJobDescription = jobDescription || '';
  const scoreColor = atsScore >= 80 ? '#16a34a' : atsScore >= 60 ? '#f59e0b' : '#ef4444';

  const handleProDownload = async () => {
    try {
      setMarkingPaid(true);
      if (finalCvId) {
        await supabase
          .from('cvs')
          .update({ payment_status: 'paid' })
          .eq('id', finalCvId);
      }
      router.push({ pathname: '/download-cv', params: { cvId: finalCvId } });
    } catch {
      router.push({ pathname: '/download-cv', params: { cvId: finalCvId } });
    } finally {
      setMarkingPaid(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{fromWorkAbroad ? 'Generated CV Preview' : 'Tailored CV Preview'}</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/landing')}
            accessibilityRole="button"
          >
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.previewWrap}>
            <View style={styles.previewCard}>
              {/* Blurred CV image background */}
              <Image
                source={require('../assets/images/cv.png')}
                style={styles.cvBgImage}
                blurRadius={22}
                resizeMode="cover"
              />
              {/* Dark overlay so lock content is readable */}
              <View style={styles.cvOverlay} />
              {isTailoringMode ? (
                <View style={styles.previewBadge}>
                  <Text style={styles.previewBadgeLabel}>ATS SCORE:</Text>
                  <Text style={[styles.previewBadgeValue, { color: scoreColor }]}>{atsScore}%</Text>
                </View>
              ) : null}
              <View style={styles.lockWrap}>
                <View style={styles.lockCircle}>
                  <MaterialIcons name="lock" size={36} color={colors.primary} />
                </View>
                <Text style={styles.lockTitle}>Full Preview Locked</Text>
                <Text style={[styles.lockSubtitle, { color: colors.primary }]}>
                  {fromWorkAbroad
                    ? 'Pay to unlock and download your ATS-optimized generated CV.'
                    : 'Pay to unlock and download your ATS-optimized tailored CV.'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What was improved</Text>
            <View style={styles.improvementList}>
              {improvements.map((item) => (
                <View key={item.title} style={styles.improvementCard}>
                  <View style={styles.improvementIcon}>
                    <MaterialIcons name="check-circle" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.improvementContent}>
                    <Text style={styles.improvementTitle}>{item.title}</Text>
                    <Text style={styles.improvementSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          {isPro ? (
            <PrimaryButton
              label={markingPaid ? 'Preparing...' : (isTailoringMode ? 'Download Tailored CV (Pro)' : 'Download Generated CV (Pro)')}
              onPress={handleProDownload}
              disabled={markingPaid}
            />
          ) : (
            <>
              <PrimaryButton
                label={isTailoringMode ? 'Download Tailored CV – $5' : 'Download Generated CV – $5'}
                onPress={() =>
                  router.push({
                    pathname: '/complete-purchase',
                    params: { cvId: finalCvId, amount: 500, serviceType: 'cv_tailoring', jobDescription: finalJobDescription },
                  })
                }
              />
              <TouchableOpacity
                onPress={() => router.push('/billing')}
                style={styles.proLinkWrap}
                accessibilityRole="button"
              >
                <Text style={styles.proLinkText}>Or get unlimited tailoring with Pro</Text>
              </TouchableOpacity>
            </>
          )}
          <Text style={styles.bottomNote}>
            {isPro ? 'Included in your Pro plan.' : 'Creates a professional new version for this specific job.'}
          </Text>
        </View>
      </View>

      <ProSuggestionModal
        visible={showProModal}
        message="Generate more CVs with even more quality. Pro includes unlimited tailoring and downloads."
        onSeePro={() => router.push('/billing')}
        onDismiss={() => {
          setShowProModal(false);
          markProPromptShown('pro_tailor_preview');
        }}
      />
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
  scrollContent: {
    paddingBottom: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
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
    fontSize: 17,
    fontWeight: '600',
  },
  previewWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  previewCard: {
    height: 360,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cvBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cvOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,18,32,0.28)',
  },
  previewBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  previewBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#637588',
  },
  previewBadgeValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  lockWrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  lockCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(13,108,242,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13,108,242,0.4)',
    marginBottom: 14,
  },
  lockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  lockSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 14,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  improvementList: {
    gap: 10,
  },
  improvementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  improvementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(13,108,242,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  improvementContent: {
    flex: 1,
  },
  improvementTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  improvementSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    gap: 6,
  },
  bottomNote: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  proLinkWrap: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  proLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
