import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

import { darkColors, useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { jobsService } from '@/services/supabase/jobs';
import { Job } from '@/types/job';
import { analytics } from '@/utils/analytics';

interface JobCardProps {
  job: Job;
  onPress: () => void;
}

const AVATAR_COLORS = [
  '#0d6cf2', '#7c3aed', '#059669', '#dc2626',
  '#d97706', '#0891b2', '#be185d', '#4f46e5',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function stripCountry(city: string | null, country: string): string {
  if (!city) return country;
  // Remove trailing country name if Adzuna appended it
  return city.replace(new RegExp(`,?\\s*${country}\\s*$`, 'i'), '').trim() || city;
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      marginBottom: 12,
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.navBorder,
      gap: 10,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    avatarText: {
      fontSize: 15,
      fontWeight: '800',
    },
    headerText: {
      flex: 1,
      gap: 3,
    },
    jobTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.textPrimary,
      lineHeight: 22,
    },
    company: {
      fontSize: 13,
      fontWeight: '600',
      color: c.primary,
    },
    saveButton: {
      paddingTop: 2,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    location: {
      fontSize: 12,
      color: c.textDim,
      fontWeight: '500',
      flex: 1,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    badge: {
      backgroundColor: c.borderSoft,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: c.navBorder,
    },
    badgeText: {
      fontSize: 11,
      color: c.textSecondary,
      fontWeight: '600',
    },
    visaBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      backgroundColor: 'transparent',
    },
    visaText: {
      fontSize: 11,
      fontWeight: '700',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: c.borderSoft,
    },
    salary: {
      fontSize: 14,
      fontWeight: '700',
      color: '#4ade80',
    },
    salaryNA: {
      fontSize: 12,
      color: c.textDim,
      fontWeight: '500',
    },
    postedDate: {
      fontSize: 11,
      color: c.textDim,
      fontWeight: '600',
    },
  });

export const JobCard: React.FC<JobCardProps> = ({ job, onPress }) => {
  const router = useRouter();
  const { colors } = useAppTheme();
  const c = colors ?? darkColors;
  const styles = makeStyles(c);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    jobsService.isJobSaved(job.id).then(setIsSaved).catch(() => {});
  }, [job.id]);

  const handleSave = async (e: any) => {
    e.stopPropagation();
    try {
      if (isSaved) {
        await jobsService.unsaveJob(job.id);
        setIsSaved(false);
      } else {
        await jobsService.saveJob(job.id, job);
        setIsSaved(true);
        analytics.jobSaved(job.id);
      }
    } catch (error: any) {
      const msg = error?.message ?? '';
      if (msg.includes('authenticated') || msg.includes('Not authenticated')) {
        Alert.alert(
          'Sign in to save jobs',
          'Create an account or sign in to save jobs.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign in', onPress: () => router.push('/login') },
          ]
        );
      }
    }
  };

  const city = stripCountry(job.city, job.country);
  const avatarColor = getAvatarColor(job.company);
  const showVisa = job.visa_sponsorship === 'YES' || job.visa_sponsorship === 'NO';
  const visaColor = job.visa_sponsorship === 'YES' ? '#4ade80' : '#f87171';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        {/* Company avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarColor + '22', borderColor: avatarColor + '44' }]}>
          <Text style={[styles.avatarText, { color: avatarColor }]}>{getInitials(job.company)}</Text>
        </View>

        <View style={styles.headerText}>
          <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
          <Text style={styles.company} numberOfLines={1}>{job.company}</Text>
        </View>

        <TouchableOpacity onPress={handleSave} style={styles.saveButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons
            name={isSaved ? 'bookmark' : 'bookmark-border'}
            size={22}
            color={isSaved ? '#0d6cf2' : '#4a5568'}
          />
        </TouchableOpacity>
      </View>

      {/* Location */}
      <View style={styles.locationRow}>
        <MaterialIcons name="location-on" size={13} color={c.textDim} />
        <Text style={styles.location} numberOfLines={1}>{city}</Text>
      </View>

      {/* Badges */}
      <View style={styles.badgeRow}>
        {job.job_type ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{job.job_type}</Text>
          </View>
        ) : null}
        {job.sector ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{job.sector}</Text>
          </View>
        ) : null}
        {showVisa ? (
          <View style={[styles.visaBadge, { borderColor: visaColor + '66' }]}>
            <Text style={[styles.visaText, { color: visaColor }]}>
              {job.visa_sponsorship === 'YES' ? '✓ Visa Sponsorship' : '✗ No Sponsorship'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Footer: salary + date */}
      <View style={styles.footer}>
        {job.salary_range ? (
          <Text style={styles.salary}>{job.salary_range}</Text>
        ) : (
          <Text style={styles.salaryNA}>Salary not listed</Text>
        )}
        <Text style={styles.postedDate}>{formatPostedDate(job.posted_date)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const formatPostedDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};
