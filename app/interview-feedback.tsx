import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

interface QuestionFeedback {
  question: string;
  score: number;
  feedback: string;
}

interface InterviewFeedback {
  overall_score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  question_feedback: QuestionFeedback[];
  recommended_practice: string[];
}

const makeScoreRingStyles = (c: AppColors) =>
  StyleSheet.create({
    wrap: { alignItems: 'center', gap: 8 },
    ring: {
      width: 110, height: 110, borderRadius: 55,
      borderWidth: 4, alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.surfaceAlt,
    },
    score: { fontSize: 34, fontWeight: '800', lineHeight: 38 },
    outOf: { fontSize: 13, color: c.textDim, fontWeight: '600' },
    label: { fontSize: 14, fontWeight: '700' },
  });

function ScoreRing({ score }: { score: number }) {
  const { colors } = useAppTheme();
  const scoreRingStyles = makeScoreRingStyles(colors);
  const color = score >= 80 ? '#4ade80' : score >= 60 ? '#fbbf24' : '#f87171';
  const label = score >= 80 ? 'Strong' : score >= 60 ? 'Good' : score >= 45 ? 'Needs Work' : 'Keep Practising';
  return (
    <View style={scoreRingStyles.wrap}>
      <View style={[scoreRingStyles.ring, { borderColor: color }]}>
        <Text style={[scoreRingStyles.score, { color }]}>{score}</Text>
        <Text style={scoreRingStyles.outOf}>/100</Text>
      </View>
      <Text style={[scoreRingStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

export default function InterviewFeedbackScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ jobTitle: string; company: string; transcript: string }>();
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  useEffect(() => {
    analyseFeedback();
  }, []);

  const analyseFeedback = async () => {
    try {
      setLoading(true);
      // refreshSession() always returns a fresh access token, avoiding
      // "Invalid JWT" errors if the token expired during the interview.
      const { data: refreshData } = await supabase.auth.refreshSession();
      const session = refreshData.session;
      if (!session) throw new Error('Session expired. Please log in again.');

      const res = await fetch(`${supabaseUrl}/functions/v1/analyze-interview`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: params.transcript,
          jobTitle: params.jobTitle,
          company: params.company,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
      setFeedback(data);
      // Session is already saved by the analyze-interview edge function.
    } catch (err: any) {
      setError(err.message || 'Failed to generate feedback');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s: number) => s >= 80 ? '#4ade80' : s >= 60 ? '#fbbf24' : '#f87171';

  if (loading) {
    return (
      <Screen>
        <View style={styles.loaderScreen}>
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderTitle}>Analysing your interview...</Text>
            <Text style={styles.loaderSub}>Our AI coach is reviewing your answers and preparing personalised feedback.</Text>
          </View>
        </View>
      </Screen>
    );
  }

  if (error || !feedback) {
    return (
      <Screen>
        <View style={styles.loaderScreen}>
          <MaterialIcons name="error-outline" size={48} color="#f87171" />
          <Text style={styles.loaderTitle}>Couldn't generate feedback</Text>
          <Text style={styles.loaderSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={analyseFeedback}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/profile')}>
            <Text style={styles.backLinkText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.replace('/profile')}>
            <MaterialIcons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Interview Feedback</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Score hero */}
          <View style={styles.scoreSection}>
            <ScoreRing score={feedback.overall_score} />
            <View style={styles.jobInfo}>
              <Text style={styles.jobInfoTitle}>{params.jobTitle}</Text>
              <Text style={styles.jobInfoCompany}>{params.company}</Text>
            </View>
          </View>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{feedback.summary}</Text>
          </View>

          {/* Strengths */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="check-circle" size={18} color="#4ade80" />
              <Text style={styles.sectionTitle}>Strengths</Text>
            </View>
            {feedback.strengths.map((s, i) => (
              <View key={i} style={styles.strengthRow}>
                <View style={styles.strengthDot} />
                <Text style={styles.strengthText}>{s}</Text>
              </View>
            ))}
          </View>

          {/* Areas to improve */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="trending-up" size={18} color="#fbbf24" />
              <Text style={styles.sectionTitle}>Areas to Improve</Text>
            </View>
            {feedback.improvements.map((item, i) => (
              <View key={i} style={styles.improvementRow}>
                <MaterialIcons name="arrow-forward" size={14} color="#fbbf24" style={{ marginTop: 3 }} />
                <Text style={styles.improvementText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Per-question breakdown */}
          {feedback.question_feedback?.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="quiz" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Question Breakdown</Text>
              </View>
              {feedback.question_feedback.map((qf, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.qCard}
                  onPress={() => setExpandedQ(expandedQ === i ? null : i)}
                  activeOpacity={0.8}
                >
                  <View style={styles.qHeader}>
                    <Text style={styles.qNum}>Q{i + 1}</Text>
                    <Text style={styles.qText} numberOfLines={expandedQ === i ? 0 : 1}>{qf.question}</Text>
                    <View style={[styles.qScore, { backgroundColor: scoreColor(qf.score) + '22' }]}>
                      <Text style={[styles.qScoreText, { color: scoreColor(qf.score) }]}>{qf.score}</Text>
                    </View>
                    <MaterialIcons
                      name={expandedQ === i ? 'expand-less' : 'expand-more'}
                      size={20} color={colors.textDim}
                    />
                  </View>
                  {expandedQ === i && (
                    <Text style={styles.qFeedback}>{qf.feedback}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recommended practice */}
          {feedback.recommended_practice?.length > 0 && (
            <View style={[styles.section, styles.practiceCard]}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="school" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Recommended Practice</Text>
              </View>
              {feedback.recommended_practice.map((r, i) => (
                <View key={i} style={styles.practiceRow}>
                  <Text style={styles.practiceNum}>{i + 1}</Text>
                  <Text style={styles.practiceText}>{r}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.practiceAgainBtn}
              onPress={() => router.replace('/interview-practice')}
            >
              <MaterialIcons name="replay" size={18} color={colors.primary} />
              <Text style={styles.practiceAgainText}>Practice Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => router.replace('/profile')}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1 },
  loaderScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  loaderContent: { alignItems: 'center', gap: 16 },
  loaderTitle: { color: c.textPrimary, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  loaderSub: { color: c.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  retryBtn: { backgroundColor: c.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  backLink: { marginTop: 4 },
  backLinkText: { color: c.textSecondary, fontSize: 13 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 56,
    borderBottomWidth: 1, borderBottomColor: c.navBorder,
  },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 24 },
  scoreSection: { alignItems: 'center', gap: 16, marginBottom: 20 },
  jobInfo: { alignItems: 'center', gap: 4 },
  jobInfoTitle: { color: c.textPrimary, fontSize: 16, fontWeight: '700' },
  jobInfoCompany: { color: c.textSecondary, fontSize: 13 },
  summaryCard: {
    backgroundColor: c.surfaceAlt, borderRadius: 14,
    borderWidth: 1, borderColor: c.navBorder,
    padding: 16, marginBottom: 20,
  },
  summaryText: { color: c.textSecondary, fontSize: 14, lineHeight: 22 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { color: c.textPrimary, fontSize: 16, fontWeight: '700' },
  strengthRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  strengthDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80', marginTop: 7, flexShrink: 0 },
  strengthText: { flex: 1, color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  improvementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  improvementText: { flex: 1, color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  qCard: {
    backgroundColor: c.surface, borderRadius: 12,
    borderWidth: 1, borderColor: c.borderSoft,
    padding: 12, marginBottom: 8,
  },
  qHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qNum: { color: c.primary, fontSize: 11, fontWeight: '800', width: 22 },
  qText: { flex: 1, color: c.textPrimary, fontSize: 13, fontWeight: '600' },
  qScore: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  qScoreText: { fontSize: 12, fontWeight: '800' },
  qFeedback: { color: c.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.borderSoft },
  practiceCard: {
    backgroundColor: 'rgba(13,108,242,0.06)',
    borderWidth: 1, borderColor: 'rgba(13,108,242,0.15)',
    borderRadius: 14, padding: 16,
  },
  practiceRow: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
  practiceNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(13,108,242,0.2)',
    color: c.primary, fontSize: 11, fontWeight: '800',
    textAlign: 'center', lineHeight: 22, flexShrink: 0,
  },
  practiceText: { flex: 1, color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  practiceAgainBtn: {
    flex: 1, height: 50, borderRadius: 14,
    borderWidth: 1.5, borderColor: 'rgba(13,108,242,0.5)',
    backgroundColor: 'rgba(13,108,242,0.08)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  practiceAgainText: { color: c.primary, fontSize: 14, fontWeight: '700' },
  doneBtn: {
    flex: 1, height: 50, borderRadius: 14,
    backgroundColor: c.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
