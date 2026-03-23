# GlobalReady - Phase 2: Jobs, Assessment & Skills Hub

## Overview
Phase 2 builds on Phase 1 by adding the complete user experience: job browsing, work abroad assessment, and polished skills hub.

**Duration:** Week 3-4  
**Goal:** Complete core features and prepare for launch

---

## 1. Jobs Feed & Search System

### Database Schema Updates
```sql
-- Ensure jobs table has proper structure
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo_url TEXT,
  country TEXT NOT NULL,
  city TEXT,
  job_type TEXT, -- 'full-time' | 'part-time' | 'contract' | 'remote'
  sector TEXT NOT NULL, -- 'Technology' | 'Healthcare' | 'Engineering' | etc.
  visa_sponsorship TEXT DEFAULT 'UNKNOWN', -- 'YES' | 'NO' | 'UNKNOWN'
  salary_range TEXT, -- e.g., "$50k - $80k"
  requirements JSONB, -- ["5+ years experience", "Bachelor's degree"]
  description TEXT NOT NULL,
  apply_url TEXT NOT NULL,
  posted_date TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_jobs_country ON public.jobs(country);
CREATE INDEX idx_jobs_sector ON public.jobs(sector);
CREATE INDEX idx_jobs_visa ON public.jobs(visa_sponsorship);
CREATE INDEX idx_jobs_active ON public.jobs(is_active);
CREATE INDEX idx_jobs_posted ON public.jobs(posted_date DESC);

-- Anyone can view active jobs
CREATE POLICY "Anyone can view active jobs"
  ON public.jobs FOR SELECT
  USING (is_active = true);
```

### Jobs Service Layer
```typescript
// services/supabase/jobs.ts
import { supabase } from '@/lib/supabase';

export interface JobFilters {
  country?: string;
  sector?: string;
  visaSponsorship?: 'YES' | 'NO' | 'UNKNOWN';
  jobType?: string;
  searchQuery?: string;
}

export const jobsService = {
  // Get all active jobs with optional filters
  getJobs: async (filters?: JobFilters, limit = 20, offset = 0) => {
    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (filters?.country) {
      query = query.eq('country', filters.country);
    }
    if (filters?.sector) {
      query = query.eq('sector', filters.sector);
    }
    if (filters?.visaSponsorship) {
      query = query.eq('visa_sponsorship', filters.visaSponsorship);
    }
    if (filters?.jobType) {
      query = query.eq('job_type', filters.jobType);
    }
    if (filters?.searchQuery) {
      query = query.or(
        `title.ilike.%${filters.searchQuery}%,company.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      );
    }

    // Order and paginate
    const { data, error, count } = await query
      .order('is_featured', { ascending: false })
      .order('posted_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return { jobs: data, total: count };
  },

  // Get single job by ID
  getJobById: async (jobId: string) => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;

    // Increment view count
    await supabase.rpc('increment_job_views', { job_id: jobId });

    return data;
  },

  // Save/bookmark job
  saveJob: async (jobId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('saved_jobs')
      .upsert({
        user_id: user.id,
        job_id: jobId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Unsave job
  unsaveJob: async (jobId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .match({ user_id: user.id, job_id: jobId });

    if (error) throw error;
  },

  // Get saved jobs
  getSavedJobs: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('saved_jobs')
      .select(`
        *,
        jobs (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Check if job is saved
  isJobSaved: async (jobId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('saved_jobs')
      .select('id')
      .match({ user_id: user.id, job_id: jobId })
      .single();

    return !!data;
  },

  // Track application (external link clicked)
  trackApplication: async (jobId: string) => {
    await supabase.rpc('increment_job_applications', { job_id: jobId });
  },
};
```

### Supabase Functions for Counters
```sql
-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_job_views(job_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.jobs
  SET view_count = view_count + 1
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment application count
CREATE OR REPLACE FUNCTION increment_job_applications(job_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.jobs
  SET application_count = application_count + 1
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;
```

### Jobs Feed Screen
```typescript
// screens/Jobs/JobsFeedScreen.tsx
import { useState, useEffect } from 'react';
import { jobsService, JobFilters } from '@/services/supabase/jobs';
import { analytics } from '@/utils/analytics';

const JobsFeedScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<JobFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [filters]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const { jobs: fetchedJobs } = await jobsService.getJobs(filters);
      setJobs(fetchedJobs);
    } catch (error) {
      Alert.alert('Error', 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const handleJobPress = (job) => {
    analytics.jobViewed(job.id);
    navigation.navigate('JobDetail', { jobId: job.id });
  };

  if (loading) {
    return <LoadingState message="Loading jobs..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Curated Jobs</Text>
        <TouchableOpacity onPress={() => setShowFilters(true)}>
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {(filters.country || filters.sector || filters.visaSponsorship) && (
        <View style={styles.activeFilters}>
          {filters.country && (
            <Chip 
              label={filters.country} 
              onRemove={() => setFilters({ ...filters, country: undefined })}
            />
          )}
          {filters.sector && (
            <Chip 
              label={filters.sector} 
              onRemove={() => setFilters({ ...filters, sector: undefined })}
            />
          )}
          {filters.visaSponsorship && (
            <Chip 
              label={`Visa: ${filters.visaSponsorship}`} 
              onRemove={() => setFilters({ ...filters, visaSponsorship: undefined })}
            />
          )}
        </View>
      )}

      {/* Jobs List */}
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => handleJobPress(item)} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No jobs found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <JobFiltersModal
        visible={showFilters}
        filters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setShowFilters(false);
        }}
        onClose={() => setShowFilters(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101722',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  filterIcon: {
    fontSize: 24,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#90a9cb',
  },
});
```

### Job Card Component
```typescript
// components/jobs/JobCard.tsx
const JobCard = ({ job, onPress }) => {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    checkSavedStatus();
  }, []);

  const checkSavedStatus = async () => {
    const saved = await jobsService.isJobSaved(job.id);
    setIsSaved(saved);
  };

  const handleSave = async () => {
    try {
      if (isSaved) {
        await jobsService.unsaveJob(job.id);
        setIsSaved(false);
      } else {
        await jobsService.saveJob(job.id);
        setIsSaved(true);
        analytics.jobSaved(job.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save job');
    }
  };

  const getVisaColor = (visa: string) => {
    switch (visa) {
      case 'YES': return '#4ade80';
      case 'NO': return '#ff6b6b';
      default: return '#90a9cb';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Company Logo */}
      {job.company_logo_url && (
        <Image 
          source={{ uri: job.company_logo_url }} 
          style={styles.logo}
        />
      )}

      {/* Featured Badge */}
      {job.is_featured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>✨ Featured</Text>
        </View>
      )}

      {/* Job Title */}
      <Text style={styles.jobTitle} numberOfLines={2}>
        {job.title}
      </Text>

      {/* Company & Location */}
      <Text style={styles.company}>{job.company}</Text>
      <Text style={styles.location}>📍 {job.city ? `${job.city}, ` : ''}{job.country}</Text>

      {/* Meta Info */}
      <View style={styles.metaRow}>
        <View style={styles.metaBadge}>
          <Text style={styles.metaText}>{job.job_type}</Text>
        </View>

        <View style={styles.metaBadge}>
          <Text style={styles.metaText}>{job.sector}</Text>
        </View>

        <View style={[styles.visaBadge, { borderColor: getVisaColor(job.visa_sponsorship) }]}>
          <Text style={[styles.visaText, { color: getVisaColor(job.visa_sponsorship) }]}>
            Visa: {job.visa_sponsorship}
          </Text>
        </View>
      </View>

      {/* Salary */}
      {job.salary_range && (
        <Text style={styles.salary}>💰 {job.salary_range}</Text>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.postedDate}>
          {formatPostedDate(job.posted_date)}
        </Text>

        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveIcon}>{isSaved ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const formatPostedDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#182434',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#314868',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 15,
  },
  featuredBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#0d6cf2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  featuredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  company: {
    fontSize: 16,
    fontWeight: '600',
    color: '#90a9cb',
    marginBottom: 5,
  },
  location: {
    fontSize: 14,
    color: '#90a9cb',
    marginBottom: 15,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metaBadge: {
    backgroundColor: '#1c2533',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#90a9cb',
  },
  visaBadge: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  visaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  salary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ade80',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postedDate: {
    fontSize: 12,
    color: '#90a9cb',
  },
  saveIcon: {
    fontSize: 24,
  },
});
```

### Job Detail Screen
```typescript
// screens/Jobs/JobDetailScreen.tsx
const JobDetailScreen = ({ route, navigation }) => {
  const { jobId } = route.params;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadJob();
  }, []);

  const loadJob = async () => {
    try {
      const jobData = await jobsService.getJobById(jobId);
      setJob(jobData);
      
      const saved = await jobsService.isJobSaved(jobId);
      setIsSaved(saved);
    } catch (error) {
      Alert.alert('Error', 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!job?.apply_url) return;

    Alert.alert(
      'Apply for This Job',
      'You will be redirected to the company\'s application page.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            await jobsService.trackApplication(jobId);
            analytics.jobApplied(jobId);
            Linking.openURL(job.apply_url);
          },
        },
      ]
    );
  };

  const handleTailorCV = () => {
    navigation.navigate('CVTailor', {
      jobDescription: job.description,
      jobTitle: job.title,
      company: job.company,
    });
  };

  const handleSave = async () => {
    try {
      if (isSaved) {
        await jobsService.unsaveJob(jobId);
        setIsSaved(false);
      } else {
        await jobsService.saveJob(jobId);
        setIsSaved(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save job');
    }
  };

  if (loading) {
    return <LoadingState message="Loading job details..." />;
  }

  if (!job) {
    return <ErrorState message="Job not found" />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {job.company_logo_url && (
          <Image source={{ uri: job.company_logo_url }} style={styles.logo} />
        )}
        <Text style={styles.title}>{job.title}</Text>
        <Text style={styles.company}>{job.company}</Text>
        <Text style={styles.location}>
          📍 {job.city ? `${job.city}, ` : ''}{job.country}
        </Text>
      </View>

      {/* Meta Info */}
      <View style={styles.metaSection}>
        <MetaItem icon="💼" label="Type" value={job.job_type} />
        <MetaItem icon="🏢" label="Sector" value={job.sector} />
        <MetaItem 
          icon="✈️" 
          label="Visa" 
          value={job.visa_sponsorship}
          valueColor={
            job.visa_sponsorship === 'YES' ? '#4ade80' :
            job.visa_sponsorship === 'NO' ? '#ff6b6b' : '#90a9cb'
          }
        />
        {job.salary_range && (
          <MetaItem icon="💰" label="Salary" value={job.salary_range} />
        )}
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job Description</Text>
        <Text style={styles.description}>{job.description}</Text>
      </View>

      {/* Requirements */}
      {job.requirements && job.requirements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {job.requirements.map((req, index) => (
            <Text key={index} style={styles.requirement}>
              • {req}
            </Text>
          ))}
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.statsText}>
          👁 {job.view_count} views • 📝 {job.application_count} applications
        </Text>
        <Text style={styles.postedText}>
          Posted {formatPostedDate(job.posted_date)}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={styles.tailorButton}
          onPress={handleTailorCV}
        >
          <Text style={styles.tailorButtonText}>
            ✨ Tailor My CV for This Job ($5)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>Apply Now</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {isSaved ? '❤️ Saved' : '🤍 Save Job'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const MetaItem = ({ icon, label, value, valueColor = '#fff' }) => (
  <View style={styles.metaItem}>
    <Text style={styles.metaIcon}>{icon}</Text>
    <View>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, { color: valueColor }]}>{value}</Text>
    </View>
  </View>
);
```

### Job Filters Modal
```typescript
// components/jobs/JobFiltersModal.tsx
const JobFiltersModal = ({ visible, filters, onApply, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const countries = ['UK', 'Germany', 'Canada', 'Netherlands', 'Australia', 'USA'];
  const sectors = ['Technology', 'Healthcare', 'Engineering', 'Finance', 'Education'];
  const visaOptions = ['YES', 'NO', 'UNKNOWN'];

  const handleReset = () => {
    setLocalFilters({});
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Jobs</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            {/* Country Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Country</Text>
              <View style={styles.optionsRow}>
                {countries.map((country) => (
                  <TouchableOpacity
                    key={country}
                    style={[
                      styles.filterOption,
                      localFilters.country === country && styles.filterOptionActive,
                    ]}
                    onPress={() =>
                      setLocalFilters({
                        ...localFilters,
                        country: localFilters.country === country ? undefined : country,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        localFilters.country === country && styles.filterOptionTextActive,
                      ]}
                    >
                      {country}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sector Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Sector</Text>
              <View style={styles.optionsRow}>
                {sectors.map((sector) => (
                  <TouchableOpacity
                    key={sector}
                    style={[
                      styles.filterOption,
                      localFilters.sector === sector && styles.filterOptionActive,
                    ]}
                    onPress={() =>
                      setLocalFilters({
                        ...localFilters,
                        sector: localFilters.sector === sector ? undefined : sector,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        localFilters.sector === sector && styles.filterOptionTextActive,
                      ]}
                    >
                      {sector}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Visa Sponsorship Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Visa Sponsorship</Text>
              <View style={styles.optionsRow}>
                {visaOptions.map((visa) => (
                  <TouchableOpacity
                    key={visa}
                    style={[
                      styles.filterOption,
                      localFilters.visaSponsorship === visa && styles.filterOptionActive,
                    ]}
                    onPress={() =>
                      setLocalFilters({
                        ...localFilters,
                        visaSponsorship:
                          localFilters.visaSponsorship === visa ? undefined : visa,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        localFilters.visaSponsorship === visa && styles.filterOptionTextActive,
                      ]}
                    >
                      {visa}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
```

---

## 2. Work Abroad Assessment (5-Step Flow)

### Assessment Database Schema
```sql
-- Assessment results table
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Step 2: Targeting
  target_country TEXT NOT NULL,
  job_sector TEXT NOT NULL,
  current_status TEXT, -- 'student' | 'employed' | 'unemployed'
  
  -- Step 3: Experience & Education
  years_experience INTEGER,
  education_level TEXT, -- 'high_school' | 'bachelors' | 'masters' | 'phd'
  field_of_study TEXT,
  
  -- Step 4: Language & History
  languages JSONB, -- [{language: "English", proficiency: "Fluent"}]
  has_applied_before BOOLEAN,
  previous_applications JSONB,
  
  -- Step 5: Results
  match_score INTEGER, -- 0-100
  skill_gaps JSONB, -- [{skill: "AWS", priority: "HIGH"}]
  recommended_actions JSONB,
  eligibility_status TEXT, -- 'strong' | 'moderate' | 'weak'
  
  status TEXT DEFAULT 'incomplete', -- 'incomplete' | 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
CREATE POLICY "Users can manage own assessments"
  ON public.assessments FOR ALL
  USING (auth.uid() = user_id);
```

### Assessment Context
```typescript
// contexts/AssessmentContext.tsx
import { createContext, useState, useContext } from 'react';

interface AssessmentData {
  // Step 2
  targetCountry?: string;
  jobSector?: string;
  currentStatus?: string;
  
  // Step 3
  yearsExperience?: number;
  educationLevel?: string;
  fieldOfStudy?: string;
  
  // Step 4
  languages?: Array<{ language: string; proficiency: string }>;
  hasAppliedBefore?: boolean;
  previousApplications?: string[];
}

const AssessmentContext = createContext(null);

export const AssessmentProvider = ({ children }) => {
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({});
  const [currentStep, setCurrentStep] = useState(1);

  const updateAssessment = (data: Partial<AssessmentData>) => {
    setAssessmentData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const saveAssessment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('assessments')
      .insert({
        user_id: user.id,
        ...assessmentData,
        status: 'completed',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return (
    <AssessmentContext.Provider
      value={{
        assessmentData,
        currentStep,
        updateAssessment,
        nextStep,
        prevStep,
        saveAssessment,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within AssessmentProvider');
  }
  return context;
};
```

### Assessment Step 2: Targeting
```typescript
// screens/Assessment/TargetingScreen.tsx
const TargetingScreen = ({ navigation }) => {
  const { assessmentData, updateAssessment, nextStep } = useAssessment();
  const [selectedCountry, setSelectedCountry] = useState(assessmentData.targetCountry);
  const [selectedSector, setSelectedSector] = useState(assessmentData.jobSector);
  const [currentStatus, setCurrentStatus] = useState(assessmentData.currentStatus);

  const countries = ['UK', 'Germany', 'Canada', 'Netherlands', 'Australia', 'USA'];
  const sectors = ['Technology', 'Healthcare', 'Engineering', 'Finance', 'Education'];
  const statuses = [
    { value: 'student', label: 'Student' },
    { value: 'employed', label: 'Currently Employed' },
    { value: 'unemployed', label: 'Unemployed/Between Jobs' },
  ];

  const handleContinue = () => {
    if (!selectedCountry || !selectedSector || !currentStatus) {
      Alert.alert('Error', 'Please complete all fields');
      return;
    }

    updateAssessment({
      targetCountry: selectedCountry,
      jobSector: selectedSector,
      currentStatus,
    });
    nextStep();
    navigation.navigate('AssessmentExperience');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.step}>Step 2 of 5</Text>
      <Text style={styles.title}>Where & What?</Text>
      <Text style={styles.subtitle}>
        Tell us about your target country and career goals
      </Text>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: '40%' }]} />
      </View>

      {/* Target Country */}
      <Text style={styles.label}>Target Country</Text>
      <View style={styles.optionsGrid}>
        {countries.map((country) => (
          <TouchableOpacity
            key={country}
            style={[
              styles.countryCard,
              selectedCountry === country && styles.countryCardActive,
            ]}
            onPress={() => setSelectedCountry(country)}
          >
            <Text style={styles.countryFlag}>{getCountryFlag(country)}</Text>
            <Text
              style={[
                styles.countryText,
                selectedCountry === country && styles.countryTextActive,
              ]}
            >
              {country}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Job Sector */}
      <Text style={styles.label}>Job Sector</Text>
      <View style={styles.optionsList}>
        {sectors.map((sector) => (
          <TouchableOpacity
            key={sector}
            style={[
              styles.sectorCard,
              selectedSector === sector && styles.sectorCardActive,
            ]}
            onPress={() => setSelectedSector(sector)}
          >
            <View style={styles.radioButton}>
              {selectedSector === sector && <View style={styles.radioButtonInner} />}
            </View>
            <Text
              style={[
                styles.sectorText,
                selectedSector === sector && styles.sectorTextActive,
              ]}
            >
              {sector}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Current Status */}
      <Text style={styles.label}>Current Status</Text>
      <View style={styles.optionsList}>
        {statuses.map((status) => (
          <TouchableOpacity
            key={status.value}
            style={[
              styles.statusCard,
              currentStatus === status.value && styles.statusCardActive,
            ]}
            onPress={() => setCurrentStatus(status.value)}
          >
            <View style={styles.radioButton}>
              {currentStatus === status.value && <View style={styles.radioButtonInner} />}
            </View>
            <Text
              style={[
                styles.statusText,
                currentStatus === status.value && styles.statusTextActive,
              ]}
            >
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const getCountryFlag = (country: string) => {
  const flags = {
    'UK': '🇬🇧',
    'Germany': '🇩🇪',
    'Canada': '🇨🇦',
    'Netherlands': '🇳🇱',
    'Australia': '🇦🇺',
    'USA': '🇺🇸',
  };
  return flags[country] || '🌍';
};
```

### Assessment Results Screen
```typescript
// screens/Assessment/ResultsScreen.tsx
const AssessmentResultsScreen = ({ navigation }) => {
  const { assessmentData, saveAssessment } = useAssessment();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateResults();
  }, []);

  const generateResults = async () => {
    try {
      // Calculate match score based on assessment data
      const matchScore = calculateMatchScore(assessmentData);
      
      // Identify skill gaps
      const skillGaps = identifySkillGaps(assessmentData);
      
      // Generate recommendations
      const recommendations = generateRecommendations(assessmentData, matchScore);

      const resultsData = {
        matchScore,
        skillGaps,
        recommendations,
        eligibility: matchScore >= 70 ? 'strong' : matchScore >= 50 ? 'moderate' : 'weak',
      };

      setResults(resultsData);

      // Save to database
      await saveAssessment();
      
    } catch (error) {
      Alert.alert('Error', 'Failed to generate results');
    } finally {
      setLoading(false);
    }
  };

  const calculateMatchScore = (data) => {
    let score = 0;
    
    // Education (30 points)
    if (data.educationLevel === 'masters' || data.educationLevel === 'phd') score += 30;
    else if (data.educationLevel === 'bachelors') score += 20;
    else score += 10;
    
    // Experience (40 points)
    if (data.yearsExperience >= 5) score += 40;
    else if (data.yearsExperience >= 3) score += 30;
    else if (data.yearsExperience >= 1) score += 20;
    else score += 10;
    
    // Languages (20 points)
    const hasEnglish = data.languages?.some(
      l => l.language === 'English' && ['Fluent', 'Native'].includes(l.proficiency)
    );
    if (hasEnglish) score += 20;
    
    // Target country language (10 points)
    const countryLanguages = {
      'Germany': 'German',
      'Netherlands': 'Dutch',
      'Canada': 'French',
    };
    const targetLang = countryLanguages[data.targetCountry];
    if (targetLang && data.languages?.some(l => l.language === targetLang)) {
      score += 10;
    }
    
    return Math.min(score, 100);
  };

  const identifySkillGaps = (data) => {
    const gaps = [];
    
    // Check for common requirements
    if (data.yearsExperience < 3) {
      gaps.push({
        skill: 'Professional Experience',
        priority: 'HIGH',
        reason: 'Most positions require 3+ years of experience',
      });
    }
    
    // Language gaps
    const hasEnglish = data.languages?.some(l => l.language === 'English');
    if (!hasEnglish) {
      gaps.push({
        skill: 'English Language',
        priority: 'HIGH',
        reason: 'English proficiency is required for most international positions',
      });
    }
    
    return gaps;
  };

  const generateRecommendations = (data, score) => {
    const recommendations = [];
    
    if (score >= 70) {
      recommendations.push({
        type: 'next_step',
        title: 'Start Applying',
        description: 'You have a strong profile. Browse curated jobs and start applying.',
        action: 'Browse Jobs',
      });
      recommendations.push({
        type: 'cv',
        title: 'Build Your CV',
        description: 'Create an ATS-optimized CV to increase your chances.',
        action: 'Build CV',
      });
    } else if (score >= 50) {
      recommendations.push({
        type: 'upskill',
        title: 'Build Missing Skills',
        description: 'Take courses to strengthen your profile.',
        action: 'View Courses',
      });
      recommendations.push({
        type: 'cv',
        title: 'Build Your CV',
        description: 'Highlight your existing strengths effectively.',
        action: 'Build CV',
      });
    } else {
      recommendations.push({
        type: 'upskill',
        title: 'Focus on Skills First',
        description: 'Your profile needs strengthening before applying.',
        action: 'View Courses',
      });
    }
    
    return recommendations;
  };

  if (loading) {
    return <LoadingState message="Analyzing your profile..." />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Match Score */}
      <View style={styles.scoreSection}>
        <View style={[
          styles.scoreCircle,
          results.eligibility === 'strong' && styles.scoreCircleStrong,
          results.eligibility === 'moderate' && styles.scoreCircleModerate,
          results.eligibility === 'weak' && styles.scoreCircleWeak,
        ]}>
          <Text style={styles.scoreNumber}>{results.matchScore}%</Text>
        </View>
        <Text style={styles.eligibilityText}>
          {results.eligibility === 'strong' && '🎯 Strong Candidate'}
          {results.eligibility === 'moderate' && '📊 Moderate Candidate'}
          {results.eligibility === 'weak' && '📚 Build Your Profile'}
        </Text>
      </View>

      {/* Skill Gaps */}
      {results.skillGaps.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Areas to Improve</Text>
          {results.skillGaps.map((gap, index) => (
            <View key={index} style={styles.gapCard}>
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>{gap.priority}</Text>
              </View>
              <View style={styles.gapContent}>
                <Text style={styles.gapSkill}>{gap.skill}</Text>
                <Text style={styles.gapReason}>{gap.reason}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended Next Steps</Text>
        {results.recommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationCard}>
            <Text style={styles.recIcon}>
              {rec.type === 'next_step' && '🚀'}
              {rec.type === 'cv' && '📄'}
              {rec.type === 'upskill' && '📚'}
            </Text>
            <View style={styles.recContent}>
              <Text style={styles.recTitle}>{rec.title}</Text>
              <Text style={styles.recDescription}>{rec.description}</Text>
              <TouchableOpacity
                style={styles.recButton}
                onPress={() => handleRecommendationAction(rec)}
              >
                <Text style={styles.recButtonText}>{rec.action} →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        This assessment is for guidance only. GlobalReady does not guarantee job offers, 
        visa approvals, or admissions.
      </Text>
    </ScrollView>
  );
};
```

---

## 3. Skills Hub Polish

### Course Catalog Screen
```typescript
// screens/SkillsHub/CourseCatalogScreen.tsx
const CourseCatalogScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const categories = [
    { value: 'all', label: 'All Courses', icon: '📚' },
    { value: 'IELTS', label: 'IELTS', icon: '🇬🇧' },
    { value: 'German', label: 'German', icon: '🇩🇪' },
    { value: 'Tech', label: 'Tech', icon: '💻' },
    { value: 'Business', label: 'Business', icon: '💼' },
  ];

  useEffect(() => {
    loadCourses();
  }, [selectedCategory]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const filters = selectedCategory !== 'all' ? { category: selectedCategory } : undefined;
      const courseData = await coursesService.getCourses(filters);
      setCourses(courseData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Skills Hub</Text>
        <Text style={styles.subtitle}>Build in-demand skills for global opportunities</Text>
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        <View style={styles.categories}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryTab,
                selectedCategory === cat.value && styles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(cat.value)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === cat.value && styles.categoryLabelActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Courses Grid */}
      {loading ? (
        <LoadingState message="Loading courses..." />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <CourseCard 
              course={item} 
              onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
            />
          )}
          contentContainerStyle={styles.coursesGrid}
        />
      )}
    </View>
  );
};

const CourseCard = ({ course, onPress }) => (
  <TouchableOpacity style={styles.courseCard} onPress={onPress}>
    {course.thumbnail_url && (
      <Image source={{ uri: course.thumbnail_url }} style={styles.thumbnail} />
    )}
    <Text style={styles.courseTitle} numberOfLines={2}>
      {course.title}
    </Text>
    <Text style={styles.courseDuration}>⏱ {course.duration_hours} hours</Text>
    <View style={styles.courseFooter}>
      <Text style={styles.learnMoreText}>Learn More →</Text>
    </View>
  </TouchableOpacity>
);
```

---

## ✅ Phase 2 Completion Checklist

### Jobs Feed
- [ ] Jobs display with filters working
- [ ] Job detail page shows all info
- [ ] Save/unsave functionality works
- [ ] External apply link tracks clicks
- [ ] Tailor CV navigation from job detail works

### Work Abroad Assessment
- [ ] All 5 steps navigate correctly
- [ ] Progress bar updates
- [ ] Match score calculates correctly
- [ ] Skill gaps display properly
- [ ] Results save to database

### Skills Hub
- [ ] Course catalog displays
- [ ] Category filters work
- [ ] Course detail pages load
- [ ] Registration flow completes
- [ ] Duplicate prevention works

### Testing
- [ ] Test full assessment flow
- [ ] Test job browsing and filters
- [ ] Test course registration
- [ ] Verify all database records save
- [ ] Test analytics tracking

---

## 🚀 After Phase 2: Final Polish (Phase 3)

- User profile & settings
- Onboarding improvements  
- Performance optimization
- Push notifications
- App Store preparation

---

**Save this as `PHASE_2.md` and let Cursor implement!** 🎯