import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { loadSkillsHubDraft, saveSkillsHubDraft } from '@/services/storage/progress';

const hoursOptions = [
  { id: '5-10', label: '5-10 hrs', icon: 'schedule' },
  { id: '10-20', label: '10-20 hrs', icon: 'timer' },
  { id: '20-30', label: '20-30 hrs', icon: 'access-time' },
  { id: '30-40+', label: '30-40+ hrs', icon: 'hourglass-full' },
];

const goalOptions = [
  { id: 'career-switch', label: 'Switch careers', icon: 'swap-horiz' },
  { id: 'upskill', label: 'Upskill', icon: 'trending-up' },
  { id: 'relocate', label: 'Work abroad', icon: 'flight-takeoff' },
  { id: 'freelance', label: 'Freelance', icon: 'laptop' },
];

export default function EarnSkillsLogisticsScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const [availability, setAvailability] = useState('10-20');
  const [goal, setGoal] = useState('upskill');

  useEffect(() => {
    const loadDraft = async () => {
      const draft = await loadSkillsHubDraft();
      if (draft?.availability) setAvailability(draft.availability);
      if (draft?.goal) setGoal(draft.goal);
    };
    loadDraft().catch(() => undefined);
  }, []);

  useEffect(() => {
    saveSkillsHubDraft({
      last_route: '/earn-skills-logistics',
      availability,
      goal,
    }).catch(() => undefined);
  }, [availability, goal]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earn Skills Path</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/landing')}
            accessibilityRole="button"
          >
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressRow}>
            <Text style={styles.progressStep}>Step 2 of 4</Text>
            <Text style={styles.progressPercent}>50% Complete</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.title}>Let's talk logistics.</Text>
            <Text style={styles.subtitle}>
              To build your roadmap, we need to know your pace and urgency.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly time available</Text>
            <View style={styles.urgencyGrid}>
              {hoursOptions.map((option) => {
                const selected = availability === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.urgencyCard, selected && styles.urgencyCardSelected]}
                    onPress={() => setAvailability(option.id)}
                    accessibilityRole="button"
                  >
                    <View style={styles.urgencyIconRow}>
                      <MaterialIcons
                        name={option.icon as never}
                        size={20}
                        color={selected ? colors.primary : colors.textSecondary}
                      />
                      <View style={[styles.urgencyCheck, selected && styles.urgencyCheckSelected]}>
                        {selected && <MaterialIcons name="check" size={12} color="#fff" />}
                      </View>
                    </View>
                    <Text style={[styles.urgencyLabel, selected && styles.urgencyLabelSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's your main goal?</Text>
            <View style={styles.urgencyGrid}>
              {goalOptions.map((option) => {
                const selected = goal === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.urgencyCard, selected && styles.urgencyCardSelected]}
                    onPress={() => setGoal(option.id)}
                    accessibilityRole="button"
                  >
                    <View style={styles.urgencyIconRow}>
                      <MaterialIcons
                        name={option.icon as never}
                        size={20}
                        color={selected ? colors.primary : colors.textSecondary}
                      />
                      <View style={[styles.urgencyCheck, selected && styles.urgencyCheckSelected]}>
                        {selected && <MaterialIcons name="check" size={12} color="#fff" />}
                      </View>
                    </View>
                    <Text style={[styles.urgencyLabel, selected && styles.urgencyLabelSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <PrimaryButton label="Next Step" icon="arrow-forward" onPress={() => router.push('/define-skill-path')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.background,
  },
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  progressWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  progressStep: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressPercent: {
    color: c.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '50%',
    height: '100%',
    backgroundColor: c.primary,
    borderRadius: 999,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 180,
  },
  hero: {
    paddingVertical: 16,
    gap: 8,
  },
  title: {
    color: c.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: c.border,
    marginVertical: 22,
  },
  urgencyGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  urgencyCard: {
    width: '47%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    padding: 14,
    backgroundColor: c.surface,
    gap: 10,
  },
  urgencyCardSelected: {
    borderColor: c.primary,
    backgroundColor: 'rgba(13,108,242,0.12)',
  },
  urgencyIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  urgencyCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyCheckSelected: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  urgencyLabel: {
    color: c.textPrimary,
    fontWeight: '600',
  },
  urgencyLabelSelected: {
    color: c.primary,
  },
  bottomBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
  },
});
