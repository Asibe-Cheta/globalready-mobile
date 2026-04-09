import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Screen } from '@/components/ui/screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/lib/supabase';
import { JobMatch, jobMatchesService } from '@/services/supabase/job-matches';

const FREE_INTERVIEW_KEY = 'gr_free_interview_used';

type Source = 'applied' | 'paste';

const PRO_BENEFITS = [
  { icon: 'psychology' as const, text: 'AI that analyses your unique communication style and adapts feedback to you' },
  { icon: 'repeat' as const, text: 'Unlimited mock interviews — practice until you feel truly ready' },
  { icon: 'insights' as const, text: 'Deep performance tracking: tone, clarity, confidence & structure' },
  { icon: 'trending-up' as const, text: 'Watch your scores improve session by session with personalised guidance' },
  { icon: 'auto-awesome' as const, text: 'Tailored coaching based on your CV, target role, and career goals' },
];

export default function InterviewPracticeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const { isPro } = useSubscription();

  const [appliedMatches, setAppliedMatches] = useState<JobMatch[]>([]);
  const [loadingApplied, setLoadingApplied] = useState(true);
  const [selectedAppliedMatch, setSelectedAppliedMatch] = useState<JobMatch | null>(null);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteCompany, setPasteCompany] = useState('');
  const [pasteDescription, setPasteDescription] = useState('');
  const [source, setSource] = useState<Source>('applied');
  const [freeSessionUsed, setFreeSessionUsed] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    loadAppliedMatches();
  }, []);

  // Re-check gating every time the screen gains focus so returning from a
  // completed session immediately shows the paywall if the limit is now reached.
  useFocusEffect(
    useCallback(() => {
      checkFreeSessionUsed(true);
    }, [isPro])
  );

  const checkFreeSessionUsed = async (showPaywallIfGated = false) => {
    try {
      // Fast local check first — set after first DB confirmation
      const local = await AsyncStorage.getItem(FREE_INTERVIEW_KEY);
      if (local === 'true') {
        setFreeSessionUsed(true);
        setCheckingAccess(false);
        if (showPaywallIfGated && !isPro) setShowPaywall(true);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Count completed sessions — authoritative source.
      // analyze-interview edge function inserts a row on session completion.
      const { count } = await supabase
        .from('interview_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((count ?? 0) >= 2) {
        setFreeSessionUsed(true);
        // Cache locally so future checks are instant
        await AsyncStorage.setItem(FREE_INTERVIEW_KEY, 'true');
        if (showPaywallIfGated && !isPro) setShowPaywall(true);
      }
    } catch {
      // DB unavailable — AsyncStorage fallback only
    } finally {
      setCheckingAccess(false);
    }
  };

  const loadAppliedMatches = async () => {
    try {
      const matches = await jobMatchesService.getAppliedMatches();
      setAppliedMatches(matches);
      if (matches.length > 0 && !selectedAppliedMatch) setSelectedAppliedMatch(matches[0]);
    } catch {
      setAppliedMatches([]);
    } finally {
      setLoadingApplied(false);
    }
  };

  const handleStartPractice = async () => {
    // Gate: free users only get one session
    if (!isPro && freeSessionUsed) {
      setShowPaywall(true);
      return;
    }

    let jobTitle: string;
    let company: string;
    let description: string;
    let jobId: string;

    if (source === 'applied' && selectedAppliedMatch?.job_data) {
      const d = selectedAppliedMatch.job_data;
      jobId = d.id || selectedAppliedMatch.job_id;
      jobTitle = d.title || 'Role';
      company = d.company || 'Company';
      description = d.description || '';
    } else if (source === 'paste' && pasteDescription.trim()) {
      jobId = '';
      jobTitle = pasteTitle.trim();
      company = pasteCompany.trim();
      description = pasteDescription.trim();
    } else {
      if (source === 'applied') {
        Alert.alert('Select a job', 'Tap "Use an applied job" then tap one of the jobs in the list to select it. Or switch to "Paste a job description" and enter details.');
      } else {
        Alert.alert('Paste a description', 'Enter at least the job description to practice.');
      }
      return;
    }

    router.push({
      pathname: '/interview-prep',
      params: {
        jobId,
        jobTitle,
        company,
        description: description.slice(0, 10000),
      },
    });
  };

  if (checkingAccess) {
    return (
      <Screen>
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Practice</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <MaterialIcons name="mic" size={36} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Mock interview practice</Text>
            <Text style={styles.heroSub}>
              Use an applied job or paste a description. The AI will ask role-specific questions and give you feedback.
            </Text>
            {!isPro && !freeSessionUsed && (
              <View style={styles.freeSessionBadge}>
                <MaterialIcons name="stars" size={16} color="#f59e0b" />
                <Text style={styles.freeSessionText}>You have 2 free sessions — make them count</Text>
              </View>
            )}
            {!isPro && freeSessionUsed && (
              <TouchableOpacity style={styles.proLockedBadge} onPress={() => setShowPaywall(true)}>
                <MaterialIcons name="lock" size={16} color={colors.primary} />
                <Text style={styles.proLockedText}>Pro required — tap to unlock unlimited sessions</Text>
              </TouchableOpacity>
            )}
            <View style={styles.tipBox}>
              <MaterialIcons name="touch-app" size={18} color={colors.primary} />
              <Text style={styles.tipText}>Tap a section below to choose your job or paste a description.</Text>
            </View>
          </View>

          {/* Use an applied job */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.sectionHeaderTouchable, source === 'applied' && styles.sectionHeaderTouchableActive]}
              onPress={() => setSource('applied')}
              accessibilityRole="button"
              accessibilityLabel="Use an applied job. Tap to select this option."
            >
              <View style={styles.sectionHeaderRow}>
                <MaterialIcons
                  name="work"
                  size={20}
                  color={source === 'applied' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.sectionTitle, source === 'applied' && styles.sectionTitleActive]}>
                  Use an applied job
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={source === 'applied' ? colors.primary : colors.textSecondary}
                  style={styles.sectionChevron}
                />
              </View>
              <Text style={styles.sectionHint}>
                {source === 'applied' && appliedMatches.length > 0
                  ? 'Tap a job below to select it'
                  : 'Tap to use this option'}
              </Text>
            </TouchableOpacity>

            {loadingApplied ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading applied jobs...</Text>
              </View>
            ) : appliedMatches.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  Mark jobs as "Applied" in Daily Matches to practice with them here.
                </Text>
              </View>
            ) : (
              <View style={styles.jobList}>
                {appliedMatches.map((match) => {
                  const d = match.job_data;
                  const isSelected = selectedAppliedMatch?.id === match.id;
                  return (
                    <TouchableOpacity
                      key={match.id}
                      style={[styles.jobCard, isSelected && styles.jobCardSelected]}
                      onPress={() => setSelectedAppliedMatch(match)}
                      accessibilityRole="button"
                    >
                      <View style={styles.jobCardContent}>
                        <Text style={styles.jobCardTitle} numberOfLines={1}>{d?.title ?? 'Role'}</Text>
                        <Text style={styles.jobCardCompany} numberOfLines={1}>{d?.company ?? 'Company'}</Text>
                      </View>
                      {isSelected && (
                        <MaterialIcons name="check-circle" size={20} color={colors.primary} style={styles.jobCardCheck} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Or paste job description */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.sectionHeaderTouchable, source === 'paste' && styles.sectionHeaderTouchableActive]}
              onPress={() => setSource('paste')}
              accessibilityRole="button"
              accessibilityLabel="Paste a job description. Tap to select this option."
            >
              <View style={styles.sectionHeaderRow}>
                <MaterialIcons
                  name="description"
                  size={20}
                  color={source === 'paste' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.sectionTitle, source === 'paste' && styles.sectionTitleActive]}>
                  Or paste a job description
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={source === 'paste' ? colors.primary : colors.textSecondary}
                  style={styles.sectionChevron}
                />
              </View>
              <Text style={styles.sectionHint}>
                {source === 'paste' ? 'Fill in the fields below' : 'Tap to use this option'}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Job title (optional)"
              placeholderTextColor={colors.inputPlaceholder}
              value={pasteTitle}
              onChangeText={setPasteTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Company (optional)"
              placeholderTextColor={colors.inputPlaceholder}
              value={pasteCompany}
              onChangeText={setPasteCompany}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Paste the full job description here..."
              placeholderTextColor={colors.inputPlaceholder}
              value={pasteDescription}
              onChangeText={setPasteDescription}
              multiline
              numberOfLines={6}
            />
          </View>

          <PrimaryButton
            label="Start practice"
            icon="mic"
            onPress={handleStartPractice}
            style={styles.startButton}
          />
        </ScrollView>
      </View>

      {/* Pro Paywall Modal */}
      <Modal
        visible={showPaywall}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaywall(false)}
      >
        <View style={styles.paywallOverlay}>
          <View style={styles.paywallSheet}>
            <View style={styles.paywallHandle} />

            <View style={styles.paywallIconWrap}>
              <MaterialIcons name="mic" size={32} color="#fff" />
            </View>

            <Text style={styles.paywallTitle}>You've used your 2 free sessions</Text>
            <Text style={styles.paywallSubtitle}>
              Unlock everything you need to get job-ready faster. Pro members get unlimited practice, deeper AI feedback, and coaching that actually moves the needle.
            </Text>

            <View style={styles.paywallBenefits}>
              {PRO_BENEFITS.map((b) => (
                <View key={b.text} style={styles.paywallBenefitRow}>
                  <View style={styles.paywallBenefitIcon}>
                    <MaterialIcons name={b.icon} size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.paywallBenefitText}>{b.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.paywallPriceRow}>
              <Text style={styles.paywallPrice}>€9.99</Text>
              <Text style={styles.paywallPricePer}>/month · cancel anytime</Text>
            </View>

            <TouchableOpacity
              style={styles.paywallCTA}
              onPress={() => {
                setShowPaywall(false);
                router.push('/billing');
              }}
            >
              <Text style={styles.paywallCTAText}>Unlock Pro</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.paywallDismiss} onPress={() => setShowPaywall(false)}>
              <Text style={styles.paywallDismissText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    container: { flex: 1 },
    centerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.navBorder,
    },
    headerSpacer: { width: 40 },
    headerTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700' },
    scroll: { paddingHorizontal: 16, paddingBottom: 100 },
    hero: { alignItems: 'center', marginTop: 20, marginBottom: 24, gap: 10 },
    heroIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.primary + '18',
      borderWidth: 1,
      borderColor: c.primary + '40',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTitle: { color: c.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center' },
    heroSub: {
      color: c.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 8,
    },
    freeSessionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(245,158,11,0.12)',
      borderRadius: 99,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.3)',
    },
    freeSessionText: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
    proLockedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.primary + '14',
      borderRadius: 99,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: c.primary + '40',
    },
    proLockedText: { color: c.primary, fontSize: 13, fontWeight: '600' },
    tipBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 4,
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: c.primary + '14',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.primary + '30',
    },
    tipText: { color: c.primary, fontSize: 13, fontWeight: '600', flex: 1 },
    section: { marginBottom: 20 },
    sectionHeaderTouchable: {
      padding: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.borderSoft,
      backgroundColor: c.surface,
      marginBottom: 12,
    },
    sectionHeaderTouchableActive: {
      borderColor: c.primary,
      backgroundColor: c.primary + '0c',
    },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionChevron: { marginLeft: 'auto' },
    sectionTitle: { color: c.textSecondary, fontSize: 16, fontWeight: '700', flex: 1 },
    sectionTitleActive: { color: c.primary },
    sectionHint: { color: c.textSecondary, fontSize: 12, marginTop: 6, marginLeft: 28 },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 },
    loadingText: { color: c.textSecondary, fontSize: 14 },
    emptyBox: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: c.borderSoft,
    },
    emptyText: { color: c.textSecondary, fontSize: 14, lineHeight: 20 },
    jobList: { gap: 8 },
    jobCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1.5,
      borderColor: c.borderSoft,
    },
    jobCardSelected: { borderColor: c.primary, backgroundColor: c.primary + '0c' },
    jobCardContent: { flex: 1 },
    jobCardTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '600' },
    jobCardCompany: { color: c.textSecondary, fontSize: 13, marginTop: 2 },
    jobCardCheck: { marginLeft: 8 },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.textPrimary,
      fontSize: 15,
      marginBottom: 10,
    },
    textArea: { minHeight: 120, textAlignVertical: 'top' },
    startButton: { marginTop: 8, marginBottom: 24 },
    // Paywall
    paywallOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'flex-end',
    },
    paywallSheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 40,
      alignItems: 'center',
    },
    paywallHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      marginBottom: 24,
    },
    paywallIconWrap: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    paywallTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: c.textPrimary,
      textAlign: 'center',
      marginBottom: 10,
    },
    paywallSubtitle: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
      marginBottom: 24,
      paddingHorizontal: 4,
    },
    paywallBenefits: { width: '100%', gap: 14, marginBottom: 28 },
    paywallBenefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    paywallBenefitIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: c.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    paywallBenefitText: {
      flex: 1,
      fontSize: 14,
      color: c.textPrimary,
      lineHeight: 20,
    },
    paywallPriceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      marginBottom: 20,
    },
    paywallPrice: { fontSize: 32, fontWeight: '800', color: c.primary },
    paywallPricePer: { fontSize: 14, color: c.textSecondary },
    paywallCTA: {
      width: '100%',
      backgroundColor: c.primary,
      borderRadius: 999,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 12,
    },
    paywallCTAText: { fontSize: 17, fontWeight: '700', color: '#fff' },
    paywallDismiss: { paddingVertical: 8 },
    paywallDismissText: { fontSize: 14, color: c.textSecondary },
  });
