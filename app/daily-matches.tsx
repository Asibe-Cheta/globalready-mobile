import * as Clipboard from 'expo-clipboard';
import * as MailComposer from 'expo-mail-composer';
import * as WebBrowser from 'expo-web-browser';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { JobMatch, jobMatchesService } from '@/services/supabase/job-matches';

const AVATAR_COLORS = ['#0d6cf2','#7c3aed','#059669','#dc2626','#d97706','#0891b2','#be185d','#4f46e5'];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function scoreColor(score: number): string {
  if (score >= 80) return '#4ade80';
  if (score >= 60) return '#fbbf24';
  return '#f87171';
}

function formatSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1000 ? `£${Math.round(n / 1000)}k` : `£${Math.round(n)}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

export default function DailyMatchesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const { isPro } = useSubscription();
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationsUsed, setGenerationsUsed] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(1);
  const [expandedCover, setExpandedCover] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const loadTodayMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const today = await jobMatchesService.getTodayMatches();
      setMatches(today);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayMatches();
  }, [loadTodayMatches]);

  const handleFindMatches = async (force = false) => {
    try {
      setGenerating(true);
      setError(null);
      const result = await jobMatchesService.findMatches(force);
      setMatches(result.matches);
      setGenerationsUsed(result.generations_used);
      setDailyLimit(result.daily_limit);
    } catch (err: any) {
      if (err.message === 'daily_limit_reached') {
        Alert.alert(
          'Daily limit reached',
          isPro
            ? `You've used all ${dailyLimit} generations for today. Come back tomorrow!`
            : 'Free users get 1 match run per day. Upgrade to Pro for 3 runs/day and 5 matches per run.',
          [
            { text: 'OK', style: 'cancel' },
            ...(!isPro ? [{ text: 'Upgrade to Pro', onPress: () => router.push('/billing') }] : []),
          ]
        );
      } else if (err.message === 'no_cv') {
        Alert.alert(
          'No CV found',
          'Build and download your CV first — AI matching uses your CV to find the best roles for you.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Build CV', onPress: () => router.push('/cv-personal-details') },
          ]
        );
      } else {
        setError(err.message || 'Failed to find matches');
      }
    } finally {
      setGenerating(false);
    }
  };

  const isMailtoJob = (url: string) => url.toLowerCase().startsWith('mailto:');

  const handleApply = async (match: JobMatch) => {
    try {
      setApplyingId(match.id);
      await jobMatchesService.updateStatus(match.id, 'applied');
      setMatches(prev => prev.map(m => m.id === match.id ? { ...m, status: 'applied' } : m));

      const applyUrl = match.job_data.apply_url;

      if (isMailtoJob(applyUrl)) {
        // Email apply: open mail composer with cover letter pre-filled
        const available = await MailComposer.isAvailableAsync();
        if (available) {
          const recipient = applyUrl.replace(/^mailto:/i, '').split('?')[0];
          await MailComposer.composeAsync({
            recipients: recipient ? [recipient] : [],
            subject: `Application for ${match.job_data.title} at ${match.job_data.company}`,
            body: match.cover_letter,
            isHtml: false,
          });
        } else {
          // Fallback: copy to clipboard
          await Clipboard.setStringAsync(match.cover_letter);
          Alert.alert('Cover letter copied!', 'Paste it into your email app to complete the application.');
        }
      } else {
        // Non-email: copy cover letter + open in-app browser
        await Clipboard.setStringAsync(match.cover_letter);
        Alert.alert(
          'Cover letter copied!',
          'Your personalised cover letter has been copied to clipboard. Paste it when you apply.',
          [{ text: 'Open Job', onPress: () => WebBrowser.openBrowserAsync(applyUrl) }]
        );
      }
    } catch {
      WebBrowser.openBrowserAsync(match.job_data.apply_url);
    } finally {
      setApplyingId(null);
    }
  };

  const handleSkip = async (match: JobMatch) => {
    await jobMatchesService.updateStatus(match.id, 'skipped').catch(() => {});
    setMatches(prev => prev.filter(m => m.id !== match.id));
  };

  const activeMatches = matches.filter(m => m.status !== 'skipped');
  const appliedCount = matches.filter(m => m.status === 'applied').length;

  return (
    <Screen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back}>
            <MaterialIcons name="arrow-back-ios-new" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Daily Matches</Text>
            {!isPro && <Text style={styles.headerBadge}>FREE</Text>}
            {isPro && <Text style={[styles.headerBadge, styles.headerBadgePro]}>PRO</Text>}
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Intro card */}
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <MaterialIcons name="auto-awesome" size={28} color={colors.primary} />
            </View>
            <View style={styles.introText}>
              <Text style={styles.introTitle}>AI-Powered Job Matching</Text>
              <Text style={styles.introBody}>
                We analyse your CV against live job listings and find your top{' '}
                {isPro ? '5' : '3'} matches — with a personalised cover letter ready to paste.
              </Text>
            </View>
          </View>

          {/* Usage bar */}
          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>
              Today: {generationsUsed}/{dailyLimit} {generationsUsed >= dailyLimit ? '(limit reached)' : 'runs used'}
            </Text>
            {!isPro && (
              <TouchableOpacity onPress={() => router.push('/billing')}>
                <Text style={styles.upgradeLink}>Upgrade for more →</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loaderText}>Checking today's matches...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="error-outline" size={48} color="#f87171" />
              <Text style={styles.emptyTitle}>Something went wrong</Text>
              <Text style={styles.emptyBody}>{error}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => handleFindMatches()}>
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : activeMatches.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="manage-search" size={64} color={colors.primary} />
              <Text style={styles.emptyTitle}>Find Your Best Matches</Text>
              <Text style={styles.emptyBody}>
                Tap below and our AI will scan live job listings for roles that match your CV — with a ready-to-use cover letter for each.
              </Text>
              {appliedCount > 0 && (
                <Text style={styles.appliedNote}>Applied to {appliedCount} job{appliedCount > 1 ? 's' : ''} today</Text>
              )}
              <TouchableOpacity
                style={[styles.primaryButton, generating && styles.primaryButtonDisabled]}
                onPress={() => handleFindMatches()}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="auto-awesome" size={18} color="#fff" />
                    <Text style={styles.primaryButtonText}>Find My Matches</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{activeMatches.length}</Text>
                  <Text style={styles.statLabel}>Matches</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: '#4ade80' }]}>
                    {Math.max(...activeMatches.map(m => m.fit_score))}%
                  </Text>
                  <Text style={styles.statLabel}>Best fit</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: '#fbbf24' }]}>{appliedCount}</Text>
                  <Text style={styles.statLabel}>Applied</Text>
                </View>
              </View>

              {/* Match cards */}
              {activeMatches.map((match) => {
                const job = match.job_data;
                const avatarColor = getAvatarColor(job.company);
                const salary = formatSalary(job.salary_min, job.salary_max);
                const isExpanded = expandedCover === match.id;
                const isApplied = match.status === 'applied';

                return (
                  <View key={match.id} style={[styles.card, isApplied && styles.cardApplied]}>
                    {/* Card header */}
                    <View style={styles.cardHeader}>
                      <View style={[styles.avatar, { backgroundColor: avatarColor + '22', borderColor: avatarColor + '44' }]}>
                        <Text style={[styles.avatarText, { color: avatarColor }]}>{getInitials(job.company)}</Text>
                      </View>
                      <View style={styles.cardHeaderText}>
                        <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
                        <Text style={styles.company}>{job.company}</Text>
                        {job.location ? (
                          <View style={styles.locationRow}>
                            <MaterialIcons name="location-on" size={11} color={colors.textDim} />
                            <Text style={styles.location}>{job.location}</Text>
                          </View>
                        ) : null}
                      </View>
                      {/* Fit score */}
                      <View style={[styles.scoreBadge, { borderColor: scoreColor(match.fit_score) + '66', backgroundColor: scoreColor(match.fit_score) + '18' }]}>
                        <Text style={[styles.scoreText, { color: scoreColor(match.fit_score) }]}>{match.fit_score}%</Text>
                        <Text style={[styles.scoreLabel, { color: scoreColor(match.fit_score) }]}>fit</Text>
                      </View>
                    </View>

                    {salary ? (
                      <Text style={styles.salary}>{salary}</Text>
                    ) : null}

                    {/* Match reasons */}
                    <View style={styles.reasonsBlock}>
                      {match.match_reasons.map((reason, i) => (
                        <View key={i} style={styles.reasonRow}>
                          <MaterialIcons name="check-circle" size={14} color="#4ade80" />
                          <Text style={styles.reasonText}>{reason}</Text>
                        </View>
                      ))}
                      {match.gaps?.map((gap, i) => (
                        <View key={i} style={styles.gapRow}>
                          <MaterialIcons name="info-outline" size={14} color="#fbbf24" />
                          <Text style={styles.gapText}>{gap}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Cover letter toggle */}
                    <TouchableOpacity
                      style={styles.coverToggle}
                      onPress={() => setExpandedCover(isExpanded ? null : match.id)}
                    >
                      <MaterialIcons name="description" size={14} color={colors.primary} />
                      <Text style={styles.coverToggleText}>
                        {isExpanded ? 'Hide cover letter ▲' : 'Preview cover letter ▼'}
                      </Text>
                    </TouchableOpacity>
                    {isExpanded ? (
                      <View style={styles.coverBlock}>
                        <Text style={styles.coverText}>{match.cover_letter}</Text>
                      </View>
                    ) : null}

                    {/* Action buttons */}
                    {!isApplied ? (
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={styles.skipButton}
                          onPress={() => handleSkip(match)}
                        >
                          <Text style={styles.skipButtonText}>Skip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.applyButton, applyingId === match.id && styles.applyButtonLoading]}
                          onPress={() => handleApply(match)}
                          disabled={applyingId === match.id}
                        >
                          {applyingId === match.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <MaterialIcons name="send" size={15} color="#fff" />
                              <Text style={styles.applyButtonText}>Copy Letter & Apply</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.appliedBanner}>
                        <MaterialIcons name="check-circle" size={16} color="#4ade80" />
                        <Text style={styles.appliedBannerText}>Applied</Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Refresh button */}
              {generationsUsed < dailyLimit && (
                <TouchableOpacity
                  style={[styles.refreshButton, generating && styles.primaryButtonDisabled]}
                  onPress={() => handleFindMatches(true)}
                  disabled={generating}
                >
                  {generating ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <MaterialIcons name="refresh" size={16} color={colors.primary} />
                      <Text style={styles.refreshButtonText}>Find New Matches ({dailyLimit - generationsUsed} left today)</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: c.navBorder,
  },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700' },
  headerBadge: {
    fontSize: 10, fontWeight: '800', color: '#94a3b8',
    backgroundColor: c.borderSoft,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
    letterSpacing: 0.5,
  },
  headerBadgePro: { color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.15)' },
  content: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 },
  introCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: 'rgba(13,108,242,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(13,108,242,0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  introIcon: { paddingTop: 2 },
  introText: { flex: 1, gap: 4 },
  introTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
  introBody: { color: c.textSecondary, fontSize: 13, lineHeight: 19 },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  usageLabel: { color: c.textDim, fontSize: 12, fontWeight: '600' },
  upgradeLink: { color: c.primary, fontSize: 12, fontWeight: '700' },
  loaderWrap: { alignItems: 'center', paddingVertical: 60, gap: 14 },
  loaderText: { color: c.textSecondary, fontSize: 14 },
  emptyWrap: { alignItems: 'center', paddingVertical: 40, gap: 14 },
  emptyTitle: { color: c.textPrimary, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyBody: { color: c.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', paddingHorizontal: 20 },
  appliedNote: { color: '#4ade80', fontSize: 13, fontWeight: '600' },
  primaryButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.primary,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14, marginTop: 8,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statBox: {
    flex: 1, alignItems: 'center',
    backgroundColor: c.surfaceAlt, borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1, borderColor: c.navBorder,
  },
  statNum: { color: c.textPrimary, fontSize: 22, fontWeight: '800' },
  statLabel: { color: c.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 2 },
  card: {
    backgroundColor: '#111827',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.navBorder,
    padding: 16,
    marginBottom: 14,
    gap: 10,
  },
  cardApplied: { borderColor: 'rgba(74,222,128,0.2)', backgroundColor: 'rgba(74,222,128,0.03)' },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  avatar: {
    width: 46, height: 46, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 15, fontWeight: '800' },
  cardHeaderText: { flex: 1, gap: 2 },
  jobTitle: { color: '#f1f5f9', fontSize: 15, fontWeight: '700', lineHeight: 21 },
  company: { color: c.primary, fontSize: 12, fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  location: { color: c.textDim, fontSize: 11 },
  scoreBadge: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6, flexShrink: 0,
  },
  scoreText: { fontSize: 16, fontWeight: '800', lineHeight: 18 },
  scoreLabel: { fontSize: 10, fontWeight: '700', lineHeight: 13 },
  salary: { color: '#4ade80', fontSize: 13, fontWeight: '700' },
  reasonsBlock: { gap: 6 },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  reasonText: { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 18 },
  gapRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  gapText: { flex: 1, color: '#fbbf24', fontSize: 12, lineHeight: 18 },
  coverToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: c.borderSoft,
  },
  coverToggleText: { color: c.primary, fontSize: 12, fontWeight: '700' },
  coverBlock: {
    backgroundColor: c.borderSoft,
    borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: c.navBorder,
  },
  coverText: { color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 20 },
  cardActions: { flexDirection: 'row', gap: 10 },
  skipButton: {
    flex: 1, height: 42, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  skipButtonText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  applyButton: {
    flex: 2.5, height: 42, borderRadius: 12,
    backgroundColor: c.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  applyButtonLoading: { opacity: 0.7 },
  applyButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  appliedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 10,
    backgroundColor: 'rgba(74,222,128,0.1)',
    borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
  },
  appliedBannerText: { color: '#4ade80', fontSize: 13, fontWeight: '700' },
  refreshButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 4,
    paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(13,108,242,0.4)',
    backgroundColor: 'rgba(13,108,242,0.06)',
  },
  refreshButtonText: { color: c.primary, fontSize: 14, fontWeight: '700' },
});
