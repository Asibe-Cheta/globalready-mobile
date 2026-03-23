import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';

interface AnalysisResult {
  match_score: number;
  matched_skills: string[];
  missing_skills: Array<{ skill: string; priority: string; reason: string }>;
  nice_to_have_skills?: string[];
  overall_assessment: string;
  recommended_courses?: Array<{ title: string; duration_hours?: number; rating?: number }>;
  cvId?: string;
  jobDescription?: string;
}

export default function JobMatchReportLowScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('gr_job_match_result')
      .then((raw) => {
        if (raw) setResult(JSON.parse(raw));
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading report..." />;
  if (!result) return null;

  const score = result.match_score ?? 0;
  const matchedSkills = result.matched_skills ?? [];
  const missingSkills = result.missing_skills ?? [];
  const recommended = result.recommended_courses ?? [];
  const scoreColor = score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back-ios" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Match Report</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} accessibilityRole="button">
              <MaterialIcons name="share" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.scoreSection}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Analysis Result</Text>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>{score}%</Text>
            </View>
            <View style={styles.scoreTrack}>
              <View style={[styles.scoreFill, { width: `${score}%`, backgroundColor: scoreColor }]} />
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <MaterialIcons name="warning" size={12} color="#f87171" />
                <Text style={styles.badgeText}>Not a Fit Yet</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeading}>The Breakdown</Text>
          <View style={styles.breakdownGrid}>
            <View style={[styles.breakdownCard, styles.matchCard]}>
              <View style={styles.breakdownHeader}>
                <MaterialIcons name="check-circle" size={18} color="#34d399" />
                <Text style={styles.breakdownTitle}>You Match</Text>
              </View>
              <View style={styles.breakdownChips}>
                {matchedSkills.length > 0 ? (
                  matchedSkills.map((skill) => (
                    <View key={skill} style={styles.matchChip}>
                      <Text style={styles.matchChipText}>{skill}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>None yet</Text>
                )}
              </View>
            </View>
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownHeader}>
                <MaterialIcons name="cancel" size={18} color={colors.textSecondary} />
                <Text style={styles.breakdownTitle}>Missing</Text>
              </View>
              <View style={styles.breakdownChips}>
                {missingSkills.map((s) => (
                  <View key={s.skill} style={styles.missingChip}>
                    <Text style={styles.missingChipText}>{s.skill.split(' ')[0]}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {missingSkills.length > 0 && (
            <>
              <View style={styles.missingHeader}>
                <Text style={styles.missingTitle}>What you're missing</Text>
                <View style={styles.priorityPill}>
                  <Text style={styles.priorityPillText}>PRIORITY</Text>
                </View>
              </View>

              <View style={styles.missingList}>
                {missingSkills.map((skill) => (
                  <View key={skill.skill} style={styles.missingCard}>
                    <View style={styles.missingIcon}>
                      <MaterialIcons name="cloud-off" size={18} color="#f87171" />
                    </View>
                    <View style={styles.missingContent}>
                      <Text style={styles.missingSkill}>{skill.skill}</Text>
                      <Text style={styles.missingReason}>{skill.reason}</Text>
                    </View>
                    <View style={styles.priorityTag}>
                      <Text style={styles.priorityTagText}>{skill.priority}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/skills-hub-welcome')}
            accessibilityRole="button"
          >
            <MaterialIcons name="school" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Check recommended courses to upskill</Text>
          </TouchableOpacity>
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              router.push({
                pathname: '/tailor-cv-optimizing',
                params: {
                  cvId: result.cvId,
                  jobDescription: result.jobDescription,
                  jobTitle: (result as any).jobTitle || '',
                },
              })
            }
            accessibilityRole="button"
          >
            <MaterialIcons name="description" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryButtonText}>Tailor CV anyway</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/tailor-job-input')} accessibilityRole="button">
            <Text style={styles.editText}>Edit job description</Text>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: c.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 260,
  },
  scoreSection: {
    marginTop: 12,
    gap: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  scoreLabel: {
    color: c.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  scoreTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.2)',
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 999,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  badgeText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyText: {
    color: c.textSecondary,
    fontSize: 11,
  },
  sectionHeading: {
    marginTop: 20,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '700',
    color: c.textPrimary,
  },
  breakdownGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    padding: 12,
    backgroundColor: c.surface,
    gap: 8,
  },
  matchCard: {
    borderColor: 'rgba(52,211,153,0.3)',
    backgroundColor: 'rgba(52,211,153,0.08)',
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownTitle: {
    color: c.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  breakdownChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  matchChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(52,211,153,0.2)',
  },
  matchChipText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
  },
  missingChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(148,163,184,0.2)',
  },
  missingChipText: {
    color: c.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  missingHeader: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.textPrimary,
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  priorityPillText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700',
  },
  missingList: {
    marginTop: 12,
    gap: 10,
  },
  missingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  missingIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingContent: {
    flex: 1,
  },
  missingSkill: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  missingReason: {
    color: c.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  priorityTagText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700',
  },
  courseRow: {
    paddingBottom: 10,
    gap: 12,
  },
  courseCard: {
    width: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    padding: 12,
    gap: 10,
  },
  courseThumb: {
    height: 90,
    borderRadius: 12,
    backgroundColor: 'rgba(13,108,242,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseTitle: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  courseMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  courseMetaText: {
    color: c.textSecondary,
    fontSize: 11,
  },
  courseAction: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(13,108,242,0.12)',
    alignItems: 'center',
  },
  courseActionText: {
    color: c.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    gap: 12,
  },
  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: c.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 54,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(148,163,184,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButtonText: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: c.border,
  },
  orText: {
    color: c.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  editText: {
    textAlign: 'center',
    color: c.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
