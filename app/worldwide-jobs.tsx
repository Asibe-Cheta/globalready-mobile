import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { JobCard } from '@/components/jobs/JobCard';
import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { fetchWorldwideJobs, type WorldwideCategory } from '@/services/worldwide-jobs';
import { Job } from '@/types/job';

const PAGE_SIZE = 20;

const CATEGORIES: { key: WorldwideCategory; label: string }[] = [
  { key: 'admin-support', label: 'Admin & Support' },
  { key: 'marketing-content', label: 'Marketing & Content' },
  { key: 'operations', label: 'Operations' },
];

export default function WorldwideJobsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<WorldwideCategory>('admin-support');
  const [total, setTotal] = useState(0);
  const currentLenRef = React.useRef(0);

  const loadJobs = useCallback(async (reset = true) => {
    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const offset = reset ? 0 : currentLenRef.current;
      const { jobs: data, total: totalCount } = await fetchWorldwideJobs(
        category,
        PAGE_SIZE,
        offset
      );

      if (reset) {
        setJobs(data || []);
        currentLenRef.current = (data || []).length;
      } else {
        setJobs(prev => {
          const next = [...prev, ...(data || [])];
          currentLenRef.current = next.length;
          return next;
        });
      }
      setTotal(totalCount || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [category]);

  useEffect(() => {
    loadJobs(true);
  }, [category]);

  const onRefresh = () => {
    setRefreshing(true);
    loadJobs(true);
  };

  const onEndReached = () => {
    if (loading || loadingMore || jobs.length >= total) return;
    loadJobs(false);
  };

  const handleJobPress = (job: Job) => {
    router.push({
      pathname: '/job-detail',
      params: { jobId: job.id, jobData: JSON.stringify(job) },
    });
  };

  const ListHeader = () => (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryRow}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryChip, category === cat.key && styles.categoryChipActive]}
            onPress={() => setCategory(cat.key)}
          >
            <Text style={[styles.categoryText, category === cat.key && styles.categoryTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {total > 0 && !loading && (
        <Text style={styles.resultCount}>{total.toLocaleString()} jobs found</Text>
      )}
      <Text style={styles.attribution}>Jobs from Jobicy, We Work Remotely, Remote OK & Remotive</Text>
    </View>
  );

  const ListEmpty = () => {
    if (loading) return null;
    if (error) {
      return (
        <View style={styles.emptyWrap}>
          <MaterialIcons name="cloud-off" size={48} color="#f87171" />
          <Text style={styles.emptyTitle}>Jobs temporarily unavailable</Text>
          <Text style={styles.emptyText}>
            We couldn't load jobs right now. Try switching to another category or come back shortly.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 8 }}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
          >
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.retryButton, category === cat.key && { opacity: 0.5 }]}
                onPress={() => setCategory(cat.key)}
                disabled={category === cat.key}
              >
                <Text style={styles.retryText}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#f87171', marginTop: 4 }]}
            onPress={() => loadJobs(true)}
          >
            <Text style={[styles.retryText, { color: '#f87171' }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <MaterialIcons name="work-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>No jobs in this category</Text>
        <Text style={styles.emptyText}>Try another category or check back later.</Text>
      </View>
    );
  };

  const ListFooter = () =>
    loadingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    ) : (
      <View style={styles.footerSpacer} />
    );

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <MaterialIcons name="arrow-back-ios-new" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Worldwide Jobs</Text>
          <View style={styles.iconSpacer} />
        </View>

        {loading && jobs.length === 0 ? (
          <View style={styles.fullLoader}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading jobs...</Text>
          </View>
        ) : (
          <FlatList
            data={jobs}
            renderItem={({ item }) => <JobCard job={item} onPress={() => handleJobPress(item)} />}
            keyExtractor={item => item.id}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={ListEmpty}
            ListFooterComponent={ListFooter}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
          />
        )}
      </View>
    </Screen>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.navBorder,
    },
    headerTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700' },
    iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    iconSpacer: { width: 40 },
    listContent: { paddingHorizontal: 16, paddingBottom: 100 },
    fullLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: c.textSecondary, fontSize: 14 },
    categoryScroll: { marginTop: 12, marginBottom: 10 },
    categoryRow: { flexDirection: 'row', gap: 10, paddingRight: 16 },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.navBorder,
    },
    categoryChipActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    categoryText: { color: c.textSecondary, fontSize: 14, fontWeight: '600' },
    categoryTextActive: { color: '#fff', fontWeight: '700' },
  resultCount: { color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  attribution: { color: c.textMuted, fontSize: 10, marginBottom: 8 },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700' },
    emptyText: { color: c.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
    retryButton: {
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: c.primary,
      marginTop: 8,
    },
    retryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    footerLoader: { paddingVertical: 20, alignItems: 'center' },
    footerSpacer: { height: 20 },
  });
