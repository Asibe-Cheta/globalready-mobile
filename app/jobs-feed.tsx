import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { JobCard } from '@/components/jobs/JobCard';
import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { ADZUNA_COUNTRIES } from '@/services/adzuna';
import { JobFilters, jobsService } from '@/services/supabase/jobs';
import { Job } from '@/types/job';

const PAGE_SIZE = 20;

type Tab = 'all' | 'remote' | 'sponsor' | 'global';

const SECTORS = [
  { label: 'All Sectors', value: '' },
  { label: 'IT & Tech', value: 'it-jobs' },
  { label: 'Healthcare', value: 'healthcare-nursing-jobs' },
  { label: 'Finance', value: 'accounting-finance-jobs' },
  { label: 'Engineering', value: 'engineering-jobs' },
  { label: 'Teaching', value: 'teaching-jobs' },
  { label: 'Sales', value: 'sales-jobs' },
  { label: 'Marketing', value: 'marketing-jobs' },
  { label: 'Legal', value: 'legal-jobs' },
  { label: 'Logistics', value: 'logistics-warehouse-jobs' },
  { label: 'Hospitality', value: 'hospitality-catering-jobs' },
  { label: 'Construction', value: 'construction-jobs' },
];

const COUNTRY_KEY = '@globalready_last_country';

export default function JobsFeedScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [selectedCountry, setSelectedCountry] = useState('gb');
  const [selectedSector, setSelectedSector] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentJobsLenRef = useRef(0);

  // Load saved country on mount
  useEffect(() => {
    AsyncStorage.getItem(COUNTRY_KEY).then(c => { if (c) setSelectedCountry(c); }).catch(() => {});
  }, []);

  const handleCountrySelect = (code: string) => {
    setSelectedCountry(code);
    setShowCountryPicker(false);
    AsyncStorage.setItem(COUNTRY_KEY, code).catch(() => {});
  };

  const buildFilters = useCallback((): JobFilters => {
    const terms = [query.trim(), selectedSector].filter(Boolean).join(' ');
    return {
      country: selectedCountry,
      searchQuery: terms || undefined,
      remote: activeTab === 'remote',
      visaSponsorship: activeTab === 'sponsor',
      globalRemote: activeTab === 'global',
    };
  }, [query, activeTab, selectedCountry, selectedSector]);

  const loadJobs = useCallback(async (reset = true) => {
    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const offset = reset ? 0 : currentJobsLenRef.current;
      const { jobs: data, total: totalCount } = await jobsService.getJobs(
        buildFilters(),
        PAGE_SIZE,
        offset
      );

      if (reset) {
        setJobs(data || []);
        currentJobsLenRef.current = (data || []).length;
      } else {
        setJobs(prev => {
          const next = [...prev, ...(data || [])];
          currentJobsLenRef.current = next.length;
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
  }, [buildFilters]);

  useEffect(() => {
    loadJobs(true);
  }, [activeTab, selectedCountry, selectedSector]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadJobs(true), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadJobs(true);
  }, [loadJobs]);

  const onEndReached = useCallback(() => {
    if (!loadingMore && currentJobsLenRef.current < total) loadJobs(false);
  }, [loadingMore, total, loadJobs]);

  const handleJobPress = (job: Job) => {
    router.push({
      pathname: '/job-detail',
      params: { jobId: job.id, jobData: JSON.stringify(job) },
    });
  };

  const activeCountry = ADZUNA_COUNTRIES.find(c => c.code === selectedCountry);

  const CountryPicker = () => (
    <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowCountryPicker(false)}>
      <TouchableOpacity style={styles.pickerSheet} activeOpacity={1} onPress={e => e.stopPropagation()}>
        <Text style={styles.pickerTitle}>Select Country</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.pickerRow, styles.pickerRowWorldwide]}
            onPress={() => {
              setShowCountryPicker(false);
              router.push('/worldwide-jobs');
            }}
          >
            <Text style={styles.pickerFlag}>🌐</Text>
            <Text style={styles.pickerLabel}>Worldwide</Text>
            <MaterialIcons name="arrow-forward-ios" size={14} color={colors.textDim} />
          </TouchableOpacity>
          {ADZUNA_COUNTRIES.map(c => (
            <TouchableOpacity
              key={c.code}
              style={[styles.pickerRow, selectedCountry === c.code && styles.pickerRowActive]}
              onPress={() => handleCountrySelect(c.code)}
            >
              <Text style={styles.pickerFlag}>{c.flag}</Text>
              <Text style={[styles.pickerLabel, selectedCountry === c.code && styles.pickerLabelActive]}>
                {c.label}
              </Text>
              {selectedCountry === c.code && (
                <MaterialIcons name="check" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View>
      <View style={styles.searchWrapper}>
        <MaterialIcons name="search" size={20} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search roles, skills, or companies..."
          placeholderTextColor={colors.inputPlaceholder}
          value={query}
          onChangeText={setQuery}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <MaterialIcons name="close" size={18} color="#6b7280" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Country selector (hidden when Global Remote; show Worldwide) */}
      {activeTab === 'global' ? (
        <View style={styles.countrySelector}>
          <Text style={styles.countrySelectorFlag}>🌐</Text>
          <Text style={styles.countrySelectorLabel}>Worldwide</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.countrySelector} onPress={() => setShowCountryPicker(true)}>
          <Text style={styles.countrySelectorFlag}>{activeCountry?.flag}</Text>
          <Text style={styles.countrySelectorLabel}>{activeCountry?.label}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={18} color="#94a3b8" />
        </TouchableOpacity>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {(['all', 'remote', 'sponsor', 'global'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'all' ? 'All Jobs' : tab === 'remote' ? 'Remote' : tab === 'sponsor' ? 'Sponsorship' : 'Global Remote'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sector filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sectorScroll}
        contentContainerStyle={styles.sectorScrollContent}
      >
        {SECTORS.map(s => (
          <TouchableOpacity
            key={s.value}
            style={[styles.sectorChip, selectedSector === s.value && styles.sectorChipActive]}
            onPress={() => setSelectedSector(s.value)}
          >
            <Text style={[styles.sectorText, selectedSector === s.value && styles.sectorTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {total > 0 && !loading && (
        <Text style={styles.resultCount}>{total.toLocaleString()} jobs found</Text>
      )}
    </View>
  );

  const ListEmpty = () => {
    if (loading) return null;
    if (error) {
      return (
        <View style={styles.emptyWrap}>
          <MaterialIcons name="error-outline" size={48} color="#f87171" />
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadJobs(true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <MaterialIcons name="work-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>No jobs found</Text>
        <Text style={styles.emptyText}>
          {query ? 'Try adjusting your search or filters.' : 'Check back later for new opportunities.'}
        </Text>
      </View>
    );
  };

  const ListFooter = () => loadingMore ? (
    <View style={styles.footerLoader}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  ) : <View style={styles.footerSpacer} />;

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/landing')}
            accessibilityRole="button"
          >
            <MaterialIcons name="arrow-back-ios-new" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Board</Text>
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
            keyExtractor={(item) => item.id}
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

        {showCountryPicker && <CountryPicker />}
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
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: c.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.navBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 10,
  },
  searchInput: { flex: 1, color: c.textPrimary, fontSize: 14 },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: c.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.navBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  countrySelectorFlag: { fontSize: 18 },
  countrySelectorLabel: { color: c.textPrimary, fontSize: 14, fontWeight: '600' },
  tabScroll: { marginBottom: 10 },
  tabRow: { flexDirection: 'row', gap: 10, paddingRight: 16 },
  tabChip: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 999,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabChipActive: { backgroundColor: c.primary },
  tabText: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: c.textPrimary, fontWeight: '700' },
  sectorScroll: { marginBottom: 10 },
  sectorScrollContent: { gap: 8, paddingRight: 4 },
  sectorChip: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 999,
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.navBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectorChipActive: {
    backgroundColor: 'rgba(13,108,242,0.2)',
    borderColor: c.primary,
  },
  sectorText: { color: c.textDim, fontSize: 12, fontWeight: '600' },
  sectorTextActive: { color: c.primary, fontWeight: '700' },
  resultCount: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700' },
  emptyText: { color: c.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: c.primary, marginTop: 8 },
  retryText: { color: c.textPrimary, fontSize: 14, fontWeight: '700' },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
  footerSpacer: { height: 20 },
  // Country picker modal
  pickerOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  pickerSheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  pickerTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: c.borderSoft,
  },
  pickerRowWorldwide: {
    backgroundColor: 'rgba(13,108,242,0.06)',
    borderRadius: 10,
    marginBottom: 8,
    borderBottomWidth: 0,
  },
  pickerRowActive: { backgroundColor: 'rgba(13,108,242,0.08)', borderRadius: 10, paddingHorizontal: 8 },
  pickerFlag: { fontSize: 22 },
  pickerLabel: { flex: 1, color: c.textSecondary, fontSize: 15, fontWeight: '500' },
  pickerLabelActive: { color: c.textPrimary, fontWeight: '700' },
});
