import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { loadSkillsHubDraft, saveSkillsHubDraft } from '@/services/storage/progress';
const skills = [
  { label: 'Physically fit', selected: true },
  { label: 'Reliable', selected: false },
  { label: 'Team worker', selected: true },
  { label: 'Shift-ready', selected: false },
  { label: 'Quick learner', selected: false },
];

const availabilityOptions = [
  {
    id: 'immediate',
    title: 'Immediate',
    subtitle: 'Ready to start within 48 hours',
    icon: 'flash-on',
  },
  {
    id: 'notice',
    title: '2–4 weeks',
    subtitle: 'Standard notice period',
    icon: 'calendar-month',
  },
  {
    id: 'flexible',
    title: 'Flexible',
    subtitle: 'Open to negotiation',
    icon: 'event-repeat',
  },
];

export default function SkillsAvailabilityScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [selectedAvailability, setSelectedAvailability] = useState('immediate');
  const [selectedSkills, setSelectedSkills] = useState(
    skills.reduce<Record<string, boolean>>((acc, skill) => {
      acc[skill.label] = skill.selected;
      return acc;
    }, {})
  );
  const router = useRouter();

  useEffect(() => {
    const loadDraft = async () => {
      const draft = await loadSkillsHubDraft();
      if (draft?.availability) setSelectedAvailability(draft.availability);
      if (draft?.skills) setSelectedSkills(draft.skills);
    };
    loadDraft().catch(() => undefined);
  }, []);

  useEffect(() => {
    saveSkillsHubDraft({
      last_route: '/skills-availability',
      availability: selectedAvailability,
      skills: selectedSkills,
    }).catch(() => undefined);
  }, [selectedAvailability, selectedSkills]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Skills & Availability</Text>
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
            <Text style={styles.progressLabel}>CV Builder</Text>
            <Text style={styles.progressStep}>Step 3 of 5</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Core Skills</Text>
            <Text style={styles.sectionSubtitle}>
              Select the top strengths you bring to the table.
            </Text>
            <View style={styles.chipWrap}>
              {skills.map((skill) => {
                const isSelected = selectedSkills[skill.label];
                return (
                  <Pressable
                    key={skill.label}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() =>
                      setSelectedSkills((prev) => ({
                        ...prev,
                        [skill.label]: !prev[skill.label],
                      }))
                    }
                  >
                    {isSelected && (
                      <MaterialIcons name="check" size={16} color="#fff" style={styles.chipIcon} />
                    )}
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {skill.label}
                    </Text>
                  </Pressable>
                );
              })}
              <TouchableOpacity style={styles.addChip} accessibilityRole="button">
                <MaterialIcons name="add" size={16} color={colors.primary} />
                <Text style={styles.addChipText}>Add Skill</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>When can you start?</Text>
            <Text style={styles.sectionSubtitle}>Employers prioritize available candidates.</Text>
            <View style={styles.optionList}>
              {availabilityOptions.map((option) => {
                const isSelected = selectedAvailability === option.id;
                return (
                  <Pressable
                    key={option.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => setSelectedAvailability(option.id)}
                  >
                    <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                      <MaterialIcons
                        name={option.icon as never}
                        size={20}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.optionCheck}>
                        <MaterialIcons name="check" size={14} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <PrimaryButton label="Next Step" icon="arrow-forward" />
          <Text style={styles.bottomNote}>You can update this later in your profile.</Text>
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
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  progressWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  progressLabel: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressStep: {
    color: c.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: c.border,
    overflow: 'hidden',
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: c.primary,
    borderRadius: 999,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 180,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: c.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: c.textSecondary,
    fontSize: 13,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(148,163,184,0.2)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: c.primary,
    shadowColor: c.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    color: c.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(148,163,184,0.4)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addChipText: {
    color: c.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.2)',
    marginVertical: 20,
  },
  optionList: {
    gap: 12,
    marginTop: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  optionCardSelected: {
    borderColor: c.primary,
    backgroundColor: 'rgba(13,108,242,0.1)',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(148,163,184,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: 'rgba(13,108,242,0.15)',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  optionSubtitle: {
    color: c.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  optionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: c.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  bottomNote: {
    textAlign: 'center',
    color: c.textSecondary,
    fontSize: 11,
  },
});
