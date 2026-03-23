import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

export default function InterviewPrepScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{
    jobId?: string;
    jobTitle?: string;
    company?: string;
    description?: string;
  }>();

  const [candidateBackground, setCandidateBackground] = useState('');

  useEffect(() => {
    // Load candidate's CV summary for context
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('cvs')
        .select('cv_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (!data?.cv_data) return;
          const cv = data.cv_data;
          const parts: string[] = [];
          if (cv.experience?.length) {
            const exp = cv.experience[0];
            parts.push(`Current/last role: ${exp.title} at ${exp.company}`);
          }
          if (cv.skills?.length) parts.push(`Skills: ${cv.skills.slice(0, 6).join(', ')}`);
          if (cv.education?.length) {
            const edu = cv.education[0];
            parts.push(`Education: ${edu.degree} from ${edu.school}`);
          }
          setCandidateBackground(parts.join('. '));
        });
    });
  }, []);

  const jobTitle = params.jobTitle ?? 'Your Target Role';
  const company = params.company ?? 'the company';
  const description = params.description ?? '';

  const handleStart = () => {
    router.push({
      pathname: '/interview-session',
      params: {
        jobId: params.jobId ?? '',
        jobTitle,
        company,
        description,
        candidateBackground,
      },
    });
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back}>
            <MaterialIcons name="arrow-back-ios-new" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Interview Prep</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <MaterialIcons name="mic" size={40} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>AI Mock Interview</Text>
            <Text style={styles.heroSub}>Practice with a real-sounding interviewer and get detailed feedback on your performance.</Text>
          </View>

          {/* Job context card */}
          {(params.jobTitle || params.company) && (
            <View style={styles.jobCard}>
              <View style={styles.jobCardHeader}>
                <MaterialIcons name="work-outline" size={16} color={colors.primary} />
                <Text style={styles.jobCardLabel}>Interviewing for</Text>
              </View>
              <Text style={styles.jobCardTitle}>{jobTitle}</Text>
              <Text style={styles.jobCardCompany}>{company}</Text>
            </View>
          )}

          {/* What to expect */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What to expect</Text>
            {[
              { icon: 'record-voice-over', text: 'A conversational AI interviewer will ask you 5–7 questions tailored to this role.' },
              { icon: 'timer', text: 'The session takes around 10–15 minutes. Find a quiet space.' },
              { icon: 'analytics', text: 'After the call you\'ll get a score, strengths, and specific areas to improve.' },
              { icon: 'replay', text: 'Practice as many times as you like — each session is fresh.' },
            ].map((item, i) => (
              <View key={i} style={styles.expectRow}>
                <View style={styles.expectIcon}>
                  <MaterialIcons name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={styles.expectText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Quick tips</Text>
            <Text style={styles.tipText}>• Speak clearly and at a natural pace</Text>
            <Text style={styles.tipText}>• Use the STAR method (Situation, Task, Action, Result)</Text>
            <Text style={styles.tipText}>• It's okay to pause and think before answering</Text>
            <Text style={styles.tipText}>• Treat it like a real interview for the best feedback</Text>
          </View>

          {/* Permission note */}
          <View style={styles.permNote}>
            <MaterialIcons name="info-outline" size={14} color={colors.textDim} />
            <Text style={styles.permNoteText}>Microphone access is required. You'll be prompted to allow it when the session starts.</Text>
          </View>

          {/* Start button */}
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <MaterialIcons name="mic" size={22} color="#fff" />
            <Text style={styles.startButtonText}>Start Interview</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 56,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 24 },
  hero: { alignItems: 'center', marginBottom: 24, gap: 12 },
  heroIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(13,108,242,0.12)',
    borderWidth: 1, borderColor: 'rgba(13,108,242,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { color: c.textPrimary, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  heroSub: { color: c.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 21, paddingHorizontal: 16 },
  jobCard: {
    backgroundColor: 'rgba(13,108,242,0.08)',
    borderWidth: 1, borderColor: 'rgba(13,108,242,0.2)',
    borderRadius: 14, padding: 14, marginBottom: 20, gap: 4,
  },
  jobCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  jobCardLabel: { color: c.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  jobCardTitle: { color: c.textPrimary, fontSize: 16, fontWeight: '700' },
  jobCardCompany: { color: c.textSecondary, fontSize: 13 },
  section: { marginBottom: 20 },
  sectionTitle: { color: c.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  expectRow: { flexDirection: 'row', gap: 14, marginBottom: 14, alignItems: 'flex-start' },
  expectIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(13,108,242,0.1)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  expectText: { flex: 1, color: c.textSecondary, fontSize: 13, lineHeight: 20, paddingTop: 8 },
  tipsCard: {
    backgroundColor: c.surfaceAlt, borderRadius: 14,
    borderWidth: 1, borderColor: c.navBorder,
    padding: 16, marginBottom: 16, gap: 8,
  },
  tipsTitle: { color: c.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  tipText: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
  permNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginBottom: 24,
  },
  permNoteText: { flex: 1, color: c.textDim, fontSize: 12, lineHeight: 18 },
  startButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: c.primary, borderRadius: 100,
    paddingVertical: 18,
  },
  startButtonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
