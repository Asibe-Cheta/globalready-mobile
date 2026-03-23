import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Screen } from '@/components/ui/screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { JobMatch, jobMatchesService } from '@/services/supabase/job-matches';

type Source = 'applied' | 'paste';

export default function InterviewPracticeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);

  const [appliedMatches, setAppliedMatches] = useState<JobMatch[]>([]);
  const [loadingApplied, setLoadingApplied] = useState(true);
  const [selectedAppliedMatch, setSelectedAppliedMatch] = useState<JobMatch | null>(null);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteCompany, setPasteCompany] = useState('');
  const [pasteDescription, setPasteDescription] = useState('');
  const [source, setSource] = useState<Source>('applied');

  useEffect(() => {
    loadAppliedMatches();
  }, []);

  const loadAppliedMatches = async () => {
    try {
      const matches = await jobMatchesService.getAppliedMatches();
      setAppliedMatches(matches);
      if (matches.length > 0 && !selectedAppliedMatch) setSelectedAppliedMatch(matches[0]);
    } catch {
      setAppliedMatches([]);
    } finally {
      setLoadingApplied(false);
    }
  };

  const handleStartPractice = () => {
    let jobTitle: string;
    let company: string;
    let description: string;
    let jobId: string;

    if (source === 'applied' && selectedAppliedMatch?.job_data) {
      const d = selectedAppliedMatch.job_data;
      jobId = d.id || selectedAppliedMatch.job_id;
      jobTitle = d.title || 'Role';
      company = d.company || 'Company';
      description = d.description || '';
    } else if (source === 'paste' && pasteDescription.trim()) {
      jobId = '';
      jobTitle = pasteTitle.trim();
      company = pasteCompany.trim();
      description = pasteDescription.trim();
    } else {
      if (source === 'applied') {
        Alert.alert('Select a job', 'Tap "Use an applied job" then tap one of the jobs in the list to select it. Or switch to "Paste a job description" and enter details.');
      } else {
        Alert.alert('Paste a description', 'Enter at least the job description to practice.');
      }
      return;
    }

    router.push({
      pathname: '/interview-prep',
      params: {
        jobId,
        jobTitle,
        company,
        description: description.slice(0, 10000),
      },
    });
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Practice</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <MaterialIcons name="mic" size={36} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Mock interview practice</Text>
            <Text style={styles.heroSub}>
              Use an applied job or paste a description. The AI will ask role-specific questions and give you feedback.
            </Text>
            <View style={styles.tipBox}>
              <MaterialIcons name="touch-app" size={18} color={colors.primary} />
              <Text style={styles.tipText}>Tap a section below to choose your job or paste a description.</Text>
            </View>
          </View>

          {/* Use an applied job */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.sectionHeaderTouchable, source === 'applied' && styles.sectionHeaderTouchableActive]}
              onPress={() => setSource('applied')}
              accessibilityRole="button"
              accessibilityLabel="Use an applied job. Tap to select this option."
            >
              <View style={styles.sectionHeaderRow}>
                <MaterialIcons
                  name="work"
                  size={20}
                  color={source === 'applied' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.sectionTitle, source === 'applied' && styles.sectionTitleActive]}>
                  Use an applied job
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={source === 'applied' ? colors.primary : colors.textSecondary}
                  style={styles.sectionChevron}
                />
              </View>
              <Text style={styles.sectionHint}>
                {source === 'applied' && appliedMatches.length > 0
                  ? 'Tap a job below to select it'
                  : 'Tap to use this option'}
              </Text>
            </TouchableOpacity>

            {loadingApplied ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading applied jobs...</Text>
              </View>
            ) : appliedMatches.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  Mark jobs as “Applied” in Daily Matches to practice with them here.
                </Text>
              </View>
            ) : (
              <View style={styles.jobList}>
                {appliedMatches.map((match) => {
                  const d = match.job_data;
                  const isSelected = selectedAppliedMatch?.id === match.id;
                  return (
                    <TouchableOpacity
                      key={match.id}
                      style={[
                        styles.jobCard,
                        isSelected && styles.jobCardSelected,
                      ]}
                      onPress={() => setSelectedAppliedMatch(match)}
                      accessibilityRole="button"
                    >
                      <View style={styles.jobCardContent}>
                        <Text style={styles.jobCardTitle} numberOfLines={1}>{d?.title ?? 'Role'}</Text>
                        <Text style={styles.jobCardCompany} numberOfLines={1}>{d?.company ?? 'Company'}</Text>
                      </View>
                      {isSelected && (
                        <MaterialIcons name="check-circle" size={20} color={colors.primary} style={styles.jobCardCheck} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Or paste job description */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.sectionHeaderTouchable, source === 'paste' && styles.sectionHeaderTouchableActive]}
              onPress={() => setSource('paste')}
              accessibilityRole="button"
              accessibilityLabel="Paste a job description. Tap to select this option."
            >
              <View style={styles.sectionHeaderRow}>
                <MaterialIcons
                  name="description"
                  size={20}
                  color={source === 'paste' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.sectionTitle, source === 'paste' && styles.sectionTitleActive]}>
                  Or paste a job description
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={22}
                  color={source === 'paste' ? colors.primary : colors.textSecondary}
                  style={styles.sectionChevron}
                />
              </View>
              <Text style={styles.sectionHint}>
                {source === 'paste' ? 'Fill in the fields below' : 'Tap to use this option'}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Job title (optional)"
              placeholderTextColor={colors.inputPlaceholder}
              value={pasteTitle}
              onChangeText={setPasteTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Company (optional)"
              placeholderTextColor={colors.inputPlaceholder}
              value={pasteCompany}
              onChangeText={setPasteCompany}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Paste the full job description here..."
              placeholderTextColor={colors.inputPlaceholder}
              value={pasteDescription}
              onChangeText={setPasteDescription}
              multiline
              numberOfLines={6}
            />
          </View>

          <PrimaryButton
            label="Start practice"
            icon="mic"
            onPress={handleStartPractice}
            style={styles.startButton}
          />
        </ScrollView>
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
    headerSpacer: { width: 40 },
    headerTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700' },
    scroll: { paddingHorizontal: 16, paddingBottom: 100 },
    hero: { alignItems: 'center', marginTop: 20, marginBottom: 24, gap: 10 },
    heroIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.primary + '18',
      borderWidth: 1,
      borderColor: c.primary + '40',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTitle: { color: c.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center' },
    heroSub: {
      color: c.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 8,
    },
    tipBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: c.primary + '14',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.primary + '30',
    },
    tipText: {
      color: c.primary,
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
    },
    section: { marginBottom: 20 },
    sectionHeaderTouchable: {
      padding: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: c.borderSoft,
      backgroundColor: c.surface,
      marginBottom: 12,
    },
    sectionHeaderTouchableActive: {
      borderColor: c.primary,
      backgroundColor: c.primary + '0c',
    },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionChevron: { marginLeft: 'auto' },
    sectionTitle: { color: c.textSecondary, fontSize: 16, fontWeight: '700', flex: 1 },
    sectionTitleActive: { color: c.primary },
    sectionHint: {
      color: c.textSecondary,
      fontSize: 12,
      marginTop: 6,
      marginLeft: 28,
    },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 },
    loadingText: { color: c.textSecondary, fontSize: 14 },
    emptyBox: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: c.borderSoft,
    },
    emptyText: { color: c.textSecondary, fontSize: 14, lineHeight: 20 },
    jobList: { gap: 8 },
    jobCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1.5,
      borderColor: c.borderSoft,
    },
    jobCardSelected: {
      borderColor: c.primary,
      backgroundColor: c.primary + '0c',
    },
    jobCardContent: { flex: 1 },
    jobCardTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '600' },
    jobCardCompany: { color: c.textSecondary, fontSize: 13, marginTop: 2 },
    jobCardCheck: { marginLeft: 8 },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.textPrimary,
      fontSize: 15,
      marginBottom: 10,
    },
    textArea: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    startButton: { marginTop: 8, marginBottom: 24 },
  });