import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import * as MailComposer from 'expo-mail-composer';
import * as WebBrowser from 'expo-web-browser';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { jobsService } from '@/services/supabase/jobs';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { Job } from '@/types/job';
import { analytics } from '@/utils/analytics';

export default function JobDetailScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const params = useLocalSearchParams<{ jobId: string; jobData?: string }>();
  const { jobId } = params;
  const { isPro } = useSubscription();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [applyUnlocked, setApplyUnlocked] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      setError(null);

      // If job data was passed via params (Adzuna jobs), use it directly
      let data: Job;
      if (params.jobData) {
        data = JSON.parse(params.jobData as string) as Job;
      } else {
        data = await jobsService.getJobById(jobId);
      }
      setJob(data);
      const saved = await jobsService.isJobSaved(jobId);
      setIsSaved(saved);
      if (isPro) setApplyUnlocked(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load job');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const toggleSave = async () => {
    if (!jobId) return;
    try {
      if (isSaved) {
        await jobsService.unsaveJob(jobId);
        setIsSaved(false);
      } else {
        await jobsService.saveJob(jobId, job ?? undefined);
        setIsSaved(true);
        analytics.jobSaved(jobId);
      }
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('authenticated') || msg.includes('Not authenticated')) {
        Alert.alert(
          'Sign in to save jobs',
          'Create an account or sign in to save jobs and access them from your profile.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign in', onPress: () => router.push('/login') },
          ]
        );
      }
    }
  };

  const handleShare = async () => {
    if (!job) return;
    try {
      await Share.share({
        message: `Check out this job: ${job.title} at ${job.company}${job.apply_url ? `\n${job.apply_url}` : ''}`,
      });
    } catch {
      // User cancelled
    }
  };

  const isMailtoJob = (url?: string | null) => !!url?.toLowerCase().startsWith('mailto:');

  const handleApply = async () => {
    if (!job?.apply_url) return;
    await jobsService.trackApplication(job.id);
    if (isMailtoJob(job.apply_url)) {
      handleEmailApply();
    } else {
      Linking.openURL(job.apply_url);
    }
  };

  const handleEmailApply = async () => {
    if (!job) return;
    const available = await MailComposer.isAvailableAsync();
    if (!available) {
      Alert.alert('Email not available', 'Please set up an email account on your device to use this feature.');
      return;
    }
    try {
      setGeneratingCoverLetter(true);
      const { data: { session } } = await supabase.auth.getSession();
      let coverLetter = '';
      if (session) {
        const res = await fetch(`${supabaseUrl}/functions/v1/generate-cover-letter`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: supabaseAnonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobTitle: job.title,
            jobCompany: job.company,
            jobDescription: job.description ?? '',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          coverLetter = data.cover_letter ?? '';
        }
      }
      // Extract recipient email from mailto: link
      const recipient = job.apply_url?.replace(/^mailto:/i, '').split('?')[0] ?? '';
      await MailComposer.composeAsync({
        recipients: recipient ? [recipient] : [],
        subject: `Application for ${job.title} at ${job.company}`,
        body: coverLetter || `Dear Hiring Team,\n\nI am writing to apply for the ${job.title} position at ${job.company}.\n\n[Please attach your CV and customise this message.]\n\nYours sincerely,`,
        isHtml: false,
      });
    } catch (err) {
      Alert.alert('Error', 'Could not open email composer. Please try again.');
    } finally {
      setGeneratingCoverLetter(false);
    }
  };

  const getCompanyInitials = (name: string) =>
    name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const AVATAR_COLORS = ['#0d6cf2','#7c3aed','#059669','#dc2626','#d97706','#0891b2','#be185d','#4f46e5'];
  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  };

  const stripCountryFromCity = (city: string | null, country: string): string => {
    if (!city) return country;
    return city.replace(new RegExp(`,?\\s*(${country}|UK|GB|DE|NL|CA|AU|IE|US|AT|CH|NZ)\\s*$`, 'i'), '').trim() || city;
  };

  const getVisaLabel = (visa: string) => {
    if (visa === 'YES') return 'Sponsorship Available';
    if (visa === 'NO') return 'No Sponsorship';
    return 'Unknown';
  };

  const getVisaColor = (visa: string) => {
    if (visa === 'YES') return '#059669';
    if (visa === 'NO') return '#dc2626';
    return colors.textMuted;
  };

  const getCompetitionColor = (level?: string) => {
    if (!level) return colors.textMuted;
    const l = level.toUpperCase();
    if (l === 'HIGH') return '#dc2626';
    if (l === 'MEDIUM') return '#d97706';
    return '#059669';
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
                <MaterialIcons name="arrow-back-ios" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Job Details</Text>
            </View>
            <View style={styles.headerRight} />
          </View>
          <View style={styles.fullLoader}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading job details...</Text>
          </View>
        </View>
      </Screen>
    );
  }

  if (error || !job) {
    return (
      <Screen>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
                <MaterialIcons name="arrow-back-ios" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Job Details</Text>
            </View>
            <View style={styles.headerRight} />
          </View>
          <View style={styles.fullLoader}>
            <MaterialIcons name="error-outline" size={48} color="#f87171" />
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error || 'Job not found'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadJob}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Screen>
    );
  }

  const reqs = job.requirements;

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
              <MaterialIcons name="arrow-back-ios" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Job Details</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton} onPress={handleShare} accessibilityRole="button">
              <MaterialIcons name="share" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={toggleSave} accessibilityRole="button">
              <MaterialIcons name={isSaved ? 'bookmark' : 'bookmark-border'} size={20} color={isSaved ? colors.primary : colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={[styles.logoWrap, { backgroundColor: getAvatarColor(job.company) + '22', borderColor: getAvatarColor(job.company) + '44' }]}>
              <Text style={[styles.logoText, { color: getAvatarColor(job.company) }]}>{getCompanyInitials(job.company)}</Text>
            </View>
            <View style={styles.heroText}>
              <Text style={styles.title}>{job.title}</Text>
              <Text style={styles.company}>{job.company}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            {job.job_type ? (
              <View style={[styles.metaBadge, styles.metaBadgePrimary]}>
                <MaterialIcons name="work-outline" size={14} color={colors.primary} />
                <Text style={styles.metaText}>{job.job_type}</Text>
              </View>
            ) : null}
            {job.salary_range ? (
              <View style={[styles.metaBadge, styles.metaBadgeSalary]}>
                <MaterialIcons name="payments" size={14} color="#4ade80" />
                <Text style={[styles.metaText, { color: '#4ade80' }]}>{job.salary_range}</Text>
              </View>
            ) : null}
            {job.city ? (
              <View style={styles.metaBadge}>
                <MaterialIcons name="location-on" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{stripCountryFromCity(job.city, job.country)}</Text>
              </View>
            ) : null}
            {job.sector ? (
              <View style={styles.metaBadge}>
                <MaterialIcons name="category" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{job.sector}</Text>
              </View>
            ) : null}
          </View>

          {!isPro && !applyUnlocked ? (
            <TouchableOpacity
              onPress={() => router.push('/billing')}
              style={styles.proCtaCard}
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <View style={styles.proCtaCardInner}>
                <View style={styles.proCtaIconWrap}>
                  <MaterialIcons name="auto-awesome" size={18} color={colors.primary} />
                </View>
                <View style={styles.proCtaTextBlock}>
                  <Text style={styles.proCtaCardLabel}>Pro</Text>
                  <Text style={styles.proCtaCardText}>Full job links — tap to learn more</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ) : null}

          {job.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Job Overview</Text>
              <Text style={styles.sectionBody}>
                {descExpanded || job.description.length <= 400
                  ? job.description
                  : job.description.slice(0, 400) + '...'}
              </Text>
              {job.description.length > 400 ? (
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setDescExpanded(v => !v)}
                >
                  <Text style={styles.expandButtonText}>
                    {descExpanded ? 'Show less ▲' : 'Show more ▼'}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <View style={styles.descPreviewNotice}>
                <MaterialIcons name="info-outline" size={13} color={colors.textDim} />
                <Text style={styles.descPreviewNoticeText}>
                  This is a short preview. The full description is on the source site.
                </Text>
              </View>
              {job.apply_url ? (
                <TouchableOpacity
                  style={styles.readFullButton}
                  onPress={() => {
                    if (applyUnlocked) {
                      WebBrowser.openBrowserAsync(job.apply_url!);
                    } else {
                      Alert.alert(
                        'Pro feature',
                        'Upgrade to Pro to read the full job description on the source site and access apply links.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Upgrade to Pro', onPress: () => router.push('/billing') },
                        ]
                      );
                    }
                  }}
                >
                  <MaterialIcons name="open-in-new" size={16} color={colors.primary} />
                  <Text style={styles.readFullButtonText}>
                    {applyUnlocked ? 'Read Full Job Description' : 'Read Full Job Description (Pro)'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {reqs?.responsibilities && reqs.responsibilities.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Responsibilities</Text>
              {reqs.responsibilities.map((item, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {reqs?.requirements && reqs.requirements.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              {reqs.requirements.map((item, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.insightCard}>
            <View style={styles.insightIcon}>
              <MaterialIcons name="insights" size={36} color={colors.textMuted} />
            </View>
            <View style={styles.insightHeader}>
              <MaterialIcons name="analytics" size={18} color={colors.primary} />
              <Text style={styles.insightTitle}>Reality Check</Text>
            </View>
            <View style={styles.insightRow}>
              <View style={styles.insightLabel}>
                <MaterialIcons name="star-half" size={18} color={colors.textSecondary} />
                <Text style={styles.insightLabelText}>Experience</Text>
              </View>
              <Text style={styles.insightValue}>{reqs?.experience_level || 'Not specified'}</Text>
            </View>
            <View style={styles.insightRow}>
              <View style={styles.insightLabel}>
                <MaterialIcons name="trending-up" size={18} color={reqs?.competition_level ? getCompetitionColor(reqs.competition_level) : colors.textSecondary} />
                <Text style={styles.insightLabelText}>Competition</Text>
              </View>
              {reqs?.competition_level ? (
                <View style={[styles.insightBadge, { backgroundColor: `${getCompetitionColor(reqs.competition_level)}33` }]}>
                  <Text style={[styles.insightBadgeText, { color: getCompetitionColor(reqs.competition_level) }]}>
                    {reqs.competition_level.toUpperCase()}
                  </Text>
                </View>
              ) : (
                <Text style={styles.insightValue}>Unknown</Text>
              )}
            </View>
            <View style={styles.insightRow}>
              <View style={styles.insightLabel}>
                <MaterialIcons name="verified-user" size={18} color={getVisaColor(job.visa_sponsorship)} />
                <Text style={styles.insightLabelText}>Visa Friendliness</Text>
              </View>
              <Text style={[styles.insightValueGreen, { color: getVisaColor(job.visa_sponsorship) }]}>
                {getVisaLabel(job.visa_sponsorship)}
              </Text>
            </View>
            {reqs?.experience_level || reqs?.competition_level ? (
              <View style={styles.insightFoot}>
                <Text style={styles.insightFootText}>
                  Insight: Tailoring your CV to match this role's requirements significantly increases your chances.
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.centerSection}>
            <TouchableOpacity
              style={[styles.applyButton, applyUnlocked && job.apply_url && styles.applyButtonActive]}
              disabled={!applyUnlocked || !job.apply_url || generatingCoverLetter}
              onPress={handleApply}
            >
              {generatingCoverLetter ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.applyButtonText, applyUnlocked && job.apply_url && styles.applyButtonTextActive]}>
                  {isMailtoJob(job.apply_url) ? 'Apply via Email' : 'Apply for this Position'}
                </Text>
              )}
            </TouchableOpacity>
            {!applyUnlocked ? (
              <View style={styles.lockRow}>
                <MaterialIcons name="lock" size={14} color={colors.primary} />
                <Text style={styles.lockText}>
                  Unlock apply link by checking your fit, tailoring your CV, or upgrading to Pro.
                </Text>
              </View>
            ) : null}
            <Text style={styles.thirdPartyNote}>
              This opportunity is hosted on a third-party platform and may have its own registration requirements, subscription, or fees.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerButtonSecondary}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/tailor-job-input',
                params: {
                  jobId: job.id,
                  jobTitle: job.title,
                  company: job.company,
                  description: job.description || '',
                },
              })
            }
          >
            <MaterialIcons name="auto-fix-high" size={16} color={colors.primary} />
            <Text style={styles.footerButtonSecondaryText}>Tailor CV</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerButtonPrimary}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/confirm-job-cv',
                params: {
                  jobId: job.id,
                  jobTitle: job.title,
                  company: job.company,
                  description: job.description || '',
                },
              })
            }
          >
            <MaterialIcons name="fact-check" size={16} color="#fff" />
            <Text style={styles.footerButtonPrimaryText}>Check Fit</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.borderSoft,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: c.textSecondary, fontSize: 14 },
  errorTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700' },
  errorText: { color: c.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: c.primary, marginTop: 8 },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  scrollContent: {
    paddingBottom: 220,
  },
  hero: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
  },
  heroText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: c.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  company: {
    color: c.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 10,
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.borderSoft,
  },
  metaBadgePrimary: {
    backgroundColor: c.primary + '18',
    borderColor: c.primary + '33',
  },
  metaBadgeSalary: {
    backgroundColor: 'rgba(74,222,128,0.12)',
    borderColor: 'rgba(74,222,128,0.25)',
  },
  metaText: {
    color: c.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionBody: {
    color: c.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  expandButton: {
    marginTop: 4,
    paddingVertical: 8,
  },
  expandButtonText: {
    color: c.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  descPreviewNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 10,
  },
  descPreviewNoticeText: {
    color: c.textDim,
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  readFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: c.primary + '80',
    backgroundColor: c.primary + '12',
    marginTop: 2,
    marginBottom: 8,
  },
  readFullButtonText: {
    color: c.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  bulletDot: {
    color: c.primary,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    color: c.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  insightCard: {
    margin: 16,
    padding: 18,
    borderRadius: 16,
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.borderSoft,
    overflow: 'hidden',
  },
  insightIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  insightTitle: {
    color: c.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  insightLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightLabelText: {
    color: c.textSecondary,
    fontSize: 14,
  },
  insightValue: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  insightBadge: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  insightBadgeText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '700',
  },
  insightValueGreen: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  insightFoot: {
    borderTopWidth: 1,
    borderTopColor: c.borderSoft,
    paddingTop: 10,
  },
  insightFootText: {
    color: c.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  centerSection: {
    paddingHorizontal: 16,
    alignItems: 'center',
    paddingBottom: 16,
  },
  applyButton: {
    width: '100%',
    height: 54,
    borderRadius: 14,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  applyButtonActive: {
    backgroundColor: c.primary,
  },
  applyButtonText: {
    color: c.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  applyButtonTextActive: {
    color: '#fff',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  lockText: {
    color: c.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    flex: 1,
  },
  thirdPartyNote: {
    color: c.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 4,
    opacity: 0.7,
  },
  proCtaCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: c.primary + '99',
    backgroundColor: c.primary + '14',
    overflow: 'hidden',
  },
  proCtaCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  proCtaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proCtaTextBlock: {
    flex: 1,
  },
  proCtaCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: c.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  proCtaCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: c.primary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    backgroundColor: c.navBg,
    borderTopWidth: 1,
    borderTopColor: c.navBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerButtonSecondary: {
    flex: 1,
    height: 50,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: c.primary + '80',
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  footerButtonSecondaryText: {
    color: c.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  footerButtonPrimary: {
    flex: 1,
    height: 50,
    borderRadius: 100,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  footerButtonPrimaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
