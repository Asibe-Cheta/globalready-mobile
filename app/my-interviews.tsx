import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { AppHeader } from '@/components/ui/app-header';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

interface InterviewSession {
  id: string;
  job_title: string;
  company: string;
  overall_score: number | null;
  created_at: string;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color = score >= 80 ? '#4ade80' : score >= 60 ? '#fbbf24' : '#f87171';
  const label = score >= 80 ? 'Strong' : score >= 60 ? 'Good' : score >= 45 ? 'Needs Work' : 'Keep Practising';
  return (
    <View style={[badgeStyles.wrap, { borderColor: color + '44', backgroundColor: color + '11' }]}>
      <Text style={[badgeStyles.score, { color }]}>{score}</Text>
      <Text style={[badgeStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center', borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6, minWidth: 64,
  },
  score: { fontSize: 20, fontWeight: '800', lineHeight: 24 },
  label: { fontSize: 10, fontWeight: '700', marginTop: 1 },
});

function SessionCard({
  session,
  onRetake,
  colors,
  styles,
}: {
  session: InterviewSession;
  onRetake: () => void;
  colors: any;
  styles: any;
}) {
  const date = new Date(session.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardMain}>
        <View style={styles.cardInfo}>
          <Text style={styles.jobTitle} numberOfLines={1}>{session.job_title}</Text>
          <Text style={styles.company} numberOfLines={1}>{session.company}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <ScoreBadge score={session.overall_score} />
      </View>
      <TouchableOpacity style={styles.retakeBtn} onPress={onRetake} activeOpacity={0.8}>
        <MaterialIcons name="replay" size={15} color={colors.primary} />
        <Text style={styles.retakeBtnText}>Retake</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MyInterviewsScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.back(); return; }

      const { data, error: err } = await supabase
        .from('interview_sessions')
        .select('id, job_title, company, overall_score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setSessions(data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  if (loading) return <LoadingState message="Loading your interviews..." />;

  return (
    <View style={styles.container}>
      <AppHeader title="My Interviews" onBack={router.back} />
      {error ? (
        <ErrorState message={error} onRetry={loadSessions} />
      ) : sessions.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="mic-none" size={52} color={colors.border} />
          <Text style={styles.emptyTitle}>No interviews yet</Text>
          <Text style={styles.emptySub}>Complete an interview practice session and your results will appear here.</Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => router.push('/interview-practice')}
            activeOpacity={0.85}
          >
            <Text style={styles.startBtnText}>Start Practising</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              colors={colors}
              styles={styles}
              onRetake={() => router.push('/interview-practice')}
            />
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  list: { padding: 20, gap: 12 },
  card: {
    backgroundColor: c.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    padding: 16,
    gap: 14,
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardInfo: { flex: 1, gap: 3 },
  jobTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '700' },
  company: { color: c.textSecondary, fontSize: 13 },
  date: { color: c.textMuted, fontSize: 11, marginTop: 2 },
  retakeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: 'rgba(13,108,242,0.4)',
    backgroundColor: 'rgba(13,108,242,0.07)',
    borderRadius: 10, height: 38,
  },
  retakeBtnText: { color: c.primary, fontSize: 13, fontWeight: '700' },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 36, gap: 12,
  },
  emptyTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptySub: { color: c.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  startBtn: {
    marginTop: 8, backgroundColor: c.primary,
    paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12,
  },
  startBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
