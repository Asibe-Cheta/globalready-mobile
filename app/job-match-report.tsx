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

export default function JobMatchReportScreen() {
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
  const gapSkills = [
    ...(result.nice_to_have_skills?.map((s) => s) ?? []),
    ...(result.missing_skills?.map((s) => s.skill) ?? []),
  ];
  const recommended = result.recommended_courses ?? [];
  const scoreColor = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const fitLabel = score >= 70 ? 'Good Fit' : score >= 50 ? 'Moderate Fit' : 'Needs Work';

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Match Report</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} accessibilityRole="button">
              <MaterialIcons name="share" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.ringWrap}>
              <View style={styles.ringTrack} />
              <View style={[styles.ringProgress, { borderColor: scoreColor }]} />
              <View style={styles.ringCenter}>
                <Text style={styles.scoreValue}>{score}%</Text>
                <Text style={styles.scoreLabel}>Match</Text>
              </View>
            </View>
            <View style={[styles.fitBadge, { backgroundColor: `${scoreColor}33`, borderColor: `${scoreColor}55` }]}>
              <Text style={[styles.fitText, { color: scoreColor }]}>{fitLabel}</Text>
            </View>
            {result.overall_assessment ? (
              <Text style={styles.heroNote}>{result.overall_assessment}</Text>
            ) : null}
          </View>

          {matchedSkills.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="check-circle" size={20} color="#22c55e" />
                <Text style={styles.sectionTitle}>Matching Skills</Text>
              </View>
              <View style={styles.chipWrap}>
                {matchedSkills.map((skill) => (
                  <View key={skill} style={styles.matchChip}>
                    <Text style={styles.matchChipText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {gapSkills.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="info" size={20} color="#f59e0b" />
                <Text style={styles.sectionTitle}>Nice-to-have (Gaps)</Text>
              </View>
              <View style={styles.chipWrap}>
                {gapSkills.map((skill) => (
                  <View key={skill} style={styles.gapChip}>
                    <Text style={styles.gapChipText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryButton}
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
            <MaterialIcons name="auto-fix-high" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Tailor My CV for This Job</Text>
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
    paddingBottom: 140,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 26,
    backgroundColor: 'rgba(13,108,242,0.08)',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 12,
  },
  ringWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ringTrack: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  ringProgress: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 8,
    borderColor: '#22c55e',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '-35deg' }],
  },
  ringCenter: {
    alignItems: 'center',
  },
  scoreValue: {
    color: c.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: c.textSecondary,
  },
  fitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  fitText: {
    fontWeight: '700',
  },
  heroNote: {
    color: c.textSecondary,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textPrimary,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  matchChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  matchChipText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  gapChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(148,163,184,0.15)',
  },
  gapChipText: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  courseList: {
    gap: 12,
    marginTop: 8,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  courseIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(13,108,242,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseContent: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: c.textPrimary,
  },
  courseMeta: {
    fontSize: 11,
    color: c.textSecondary,
    marginTop: 4,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
  },
  primaryButton: {
    height: 56,
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
    fontSize: 14,
    fontWeight: '700',
  },
});
