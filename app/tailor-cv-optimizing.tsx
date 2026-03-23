import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { theme } from '@/constants/globalready-theme';
import { fetchUserLatestCV, parseUploadedCVOnDemand, tailorCV, tailorCVFromText } from '@/services/ai/cvAnalysis';
import { loadTailorCvDraft, saveTailorCvDraft } from '@/services/storage/progress';

const statusMessages = [
  'Analyzing Keywords...',
  'Matching experience to job...',
  'Optimizing skills alignment...',
  'Rewriting descriptions...',
  'Finalizing your tailored CV...',
];

export default function TailorCvOptimizingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [statusIndex, setStatusIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    saveTailorCvDraft({ last_route: '/tailor-cv-optimizing' }).catch(() => undefined);

    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0.75,
      duration: 10000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    runTailoring();
  }, []);

  const runTailoring = async () => {
    try {
      // Get job description and title from params or draft
      let jobDescription = params.jobDescription as string | undefined;
      let jobTitle = params.jobTitle as string | undefined;
      if (!jobDescription) {
        const draft = await loadTailorCvDraft();
        jobDescription = draft?.job_description ?? undefined;
        jobTitle = jobTitle || (draft?.job_title ?? undefined);
      }

      if (!jobDescription && !jobTitle) {
        Alert.alert('Missing Job Info', 'Please enter a job description first.', [
          { text: 'Go Back', onPress: () => router.back() },
        ]);
        return;
      }

      // Fetch the user's CV
      const cv = await fetchUserLatestCV();
      if (!cv) {
        Alert.alert('No CV Found', 'Build a CV first before tailoring.', [
          { text: 'Build CV', onPress: () => router.push('/cv-personal-details') },
        ]);
        return;
      }

      // Call the tailoring edge function — handle both built and uploaded CVs
      let tailoredResult;
      if (cv.type === 'uploaded') {
        let rawText = cv.cvData?.raw_text;
        if (!rawText && cv.parsePending) {
          rawText = await parseUploadedCVOnDemand(cv.id);
        }
        tailoredResult = await tailorCVFromText(rawText || '', jobDescription || '', jobTitle);
      } else {
        tailoredResult = await tailorCV(cv.cvData, jobDescription || '', jobTitle);
      }

      // Store the result for the preview screen
      await AsyncStorage.setItem(
        'gr_tailored_cv_result',
        JSON.stringify({
          original: cv.cvData,
          tailored: tailoredResult,
          cvId: cv.id,
          jobDescription,
        })
      );

      // Animate to 100% then navigate
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        router.replace({
          pathname: '/tailored-cv-preview',
          params: { cvId: cv.id, jobDescription },
        });
      });
    } catch (error: any) {
      console.error('CV tailoring error:', error);
      setFailed(true);
      Alert.alert(
        'Tailoring Failed',
        error.message || 'Something went wrong. Please try again.',
        [{ text: 'Go Back', onPress: () => router.back() }]
      );
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push('/landing')}
          accessibilityRole="button"
        >
          <MaterialIcons name="home" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.content}>
          <View style={styles.heroWrap}>
            <View style={styles.heroGlow} />
            <View style={styles.heroRing}>
              <View style={styles.heroImage} />
              <MaterialIcons name="document-scanner" size={56} color={colors.primary} />
            </View>
          </View>

          <Text style={styles.title}>
            {failed ? 'Tailoring failed' : 'Optimizing your CV for this role…'}
          </Text>
          <Text style={styles.subtitle}>
            {failed
              ? 'Something went wrong. Please try again.'
              : "We're matching your experience to the job requirements and improving keyword alignment."}
          </Text>

          <View style={styles.progressWrap}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>{statusMessages[statusIndex]}</Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={router.back} accessibilityRole="button">
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
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
  homeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    zIndex: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(13,108,242,0.16)',
  },
  heroRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(15,23,42,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  progressWrap: {
    width: '100%',
    maxWidth: 280,
    gap: 10,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  progressLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  footer: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.15)',
  },
  cancelText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
});
