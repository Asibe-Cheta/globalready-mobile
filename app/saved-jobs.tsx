import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, Text } from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { JobCard } from '@/components/jobs/JobCard';
import { LoadingState } from '@/components/LoadingState';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { jobsService } from '@/services/supabase/jobs';
import { analytics } from '@/utils/analytics';

export default function SavedJobsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedJobs();
  }, []);

  const loadSavedJobs = async () => {
    try {
      const data = await jobsService.getSavedJobs();
      setSavedJobs(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load saved jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleJobPress = (job: any) => {
    analytics.jobViewed(job.id);
    router.push({
      pathname: '/job-detail',
      params: { jobId: job.id },
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/landing');
    }
  };

  if (loading) {
    return <LoadingState message="Loading saved jobs..." />;
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Saved Jobs" onBack={handleBack} />
      {savedJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <MaterialIcons name="bookmark-border" size={56} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No saved jobs yet</Text>
          <Text style={styles.emptyMessage}>
            Jobs you save will appear here. Tap the bookmark on any job to add it.
          </Text>
          <PrimaryButton
            label="Browse jobs"
            onPress={() => router.push('/jobs-feed')}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <FlatList
          data={savedJobs}
          keyExtractor={(item) => item.job_id || item.jobs?.id}
          renderItem={({ item }) => (
            <JobCard
              job={item.jobs || item}
              onPress={() => handleJobPress(item.jobs || item)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 15,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 160,
  },
});
