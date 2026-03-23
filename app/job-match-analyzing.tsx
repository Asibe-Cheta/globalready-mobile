import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { analyzeCVJobMatch, cvDataToText, fetchUserLatestCV, parseUploadedCVOnDemand } from '@/services/ai/cvAnalysis';
import { loadTailorCvDraft } from '@/services/storage/progress';

const statusMessages = [
  'Loading your CV data...',
  'Reading job requirements...',
  'Comparing skills & experience...',
  'Identifying gaps...',
  'Generating match report...',
];

export default function JobMatchAnalyzingScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();
  const [statusIndex, setStatusIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [noCv, setNoCv] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();
    return () => spinLoop.stop();
  }, [spinAnim]);

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-35deg', '325deg'],
  });

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0.8,
      duration: 8000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    try {
      const draft = await loadTailorCvDraft();
      const jobTitle = draft?.job_title || '';
      const jobDescription = draft?.job_description || '';
      if (!jobDescription && !jobTitle) {
        Alert.alert('Missing Job Info', 'Please enter a job description first.', [
          { text: 'Go Back', onPress: () => router.back() },
        ]);
        return;
      }

      const cv = await fetchUserLatestCV();
      if (!cv) {
        setNoCv(true);
        return;
      }

      // Handle both built CVs (structured JSON) and uploaded CVs (raw text)
      let cvText: string;
      if (cv.type === 'uploaded') {
        if (cv.parsePending) {
          // CV was uploaded but not yet parsed — parse on-demand now
          cvText = await parseUploadedCVOnDemand(cv.id);
        } else {
          cvText = cv.cvData.raw_text;
        }
      } else {
        cvText = cvDataToText(cv.cvData);
      }

      const result = await analyzeCVJobMatch(cvText, jobDescription, jobTitle);

      await AsyncStorage.setItem(
        'gr_job_match_result',
        JSON.stringify({ ...result, cvId: cv.id, jobDescription, jobTitle })
      );

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        const score = result.match_score ?? 0;
        if (score >= 60) {
          router.replace('/job-match-report');
        } else {
          router.replace('/job-match-report-low');
        }
      });
    } catch (error: any) {
      console.error('Job match analysis error:', error);
      setFailed(true);
      Alert.alert(
        'Analysis Failed',
        error.message || 'Something went wrong. Please try again.',
        [{ text: 'Go Back', onPress: () => router.back() }]
      );
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (noCv) {
    return (
      <Screen>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.ringWrap}>
              <View style={styles.outerGlow} />
              <View style={[styles.trackRing, { borderColor: '#f59e0b' }]} />
              <View style={styles.centerStack}>
                <MaterialIcons name="description" size={46} color="#f59e0b" />
              </View>
            </View>
            <View style={styles.statusBlock}>
              <Text style={styles.title}>No CV Found</Text>
              <Text style={styles.subtitle}>
                You need to build a CV first before we can analyze your job match.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.buildCvButton}
              onPress={() => router.push('/cv-personal-details')}
              accessibilityRole="button"
            >
              <MaterialIcons name="edit-document" size={18} color="#fff" />
              <Text style={styles.buildCvText}>Build Your CV</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={router.back} accessibilityRole="button">
              <Text style={styles.goBackText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={router.back} style={styles.backButton} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {failed ? 'Analysis Failed' : 'Job Match: Analyzing...'}
          </Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          <View style={styles.ringWrap}>
            <View style={styles.outerGlow} />
            <View style={styles.trackRing} />
            <Animated.View style={[styles.progressRing, { transform: [{ rotate: spinRotation }] }]} />
            <View style={styles.centerStack}>
              <MaterialIcons name="radar" size={46} color={colors.primary} />
            </View>
          </View>

          <View style={styles.statusBlock}>
            <Text style={styles.title}>
              {failed ? 'Something went wrong' : 'Analyzing Job Requirements...'}
            </Text>
            <Text style={styles.subtitle}>{statusMessages[statusIndex]}</Text>
          </View>

          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
          </View>

          <Text style={styles.footerNote}>
            Identifying gaps & tailoring your profile. This usually takes less than 30 seconds.
          </Text>
        </View>

        <View style={styles.brandFooter}>
          <MaterialIcons name="language" size={18} color="rgba(255,255,255,0.35)" />
          <Text style={styles.brandText}>GlobalReady</Text>
        </View>

        <View style={styles.glowLeft} />
        <View style={styles.glowRight} />
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
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ringWrap: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  outerGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(13,108,242,0.2)',
    opacity: 0.5,
  },
  trackRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: c.border,
  },
  progressRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: c.primary,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  centerStack: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusBlock: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: c.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  progressWrap: {
    width: '100%',
    maxWidth: 320,
    marginTop: 18,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: c.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: c.primary,
    borderRadius: 999,
  },
  footerNote: {
    marginTop: 24,
    color: 'rgba(144,169,203,0.7)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  brandFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingBottom: 24,
    opacity: 0.3,
  },
  brandText: {
    color: c.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  buildCvButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: c.primary,
  },
  buildCvText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  goBackText: {
    color: c.textSecondary,
    fontSize: 13,
    marginTop: 16,
  },
  glowLeft: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(13,108,242,0.1)',
    bottom: -80,
    left: -80,
  },
  glowRight: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(13,108,242,0.05)',
    top: -80,
    right: -80,
  },
});
