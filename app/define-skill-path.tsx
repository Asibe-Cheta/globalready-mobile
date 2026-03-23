import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { loadSkillsHubDraft, saveSkillsHubDraft } from '@/services/storage/progress';

const paths = [
  {
    id: 'tech',
    title: 'Tech career path',
    subtitle: 'Software, Data, or Design',
    icon: 'terminal',
  },
  {
    id: 'side',
    title: 'High Income Skills',
    subtitle: 'Writing, Social Media, or Admin',
    icon: 'payments',
  },
  {
    id: 'german',
    title: 'Learn German Language and move to Germany',
    subtitle: 'Language certification & relocation',
    icon: 'castle',
  },
];

const hoursOptions = [
  { id: '5-10', label: '5-10 hrs', icon: 'schedule' },
  { id: '10-20', label: '10-20 hrs', icon: 'timer' },
  { id: '20-30', label: '20-30 hrs', icon: 'access-time' },
  { id: '30-40+', label: '30-40+ hrs', icon: 'hourglass-full' },
];

export default function DefineSkillPathScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [selectedPath, setSelectedPath] = useState('tech');
  const [availability, setAvailability] = useState('10-20');
  const router = useRouter();

  useEffect(() => {
    const loadDraft = async () => {
      const draft = await loadSkillsHubDraft();
      if (draft?.selected_path) setSelectedPath(draft.selected_path);
      if (draft?.availability) setAvailability(draft.availability);
    };
    loadDraft().catch(() => undefined);
  }, []);

  useEffect(() => {
    saveSkillsHubDraft({
      last_route: '/define-skill-path',
      selected_path: selectedPath,
      availability,
    }).catch(() => undefined);
  }, [selectedPath, availability]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Define Your Skill Path</Text>
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
            <Text style={styles.progressStep}>Step 1 of 4</Text>
            <Text style={styles.progressPercent}>25% Complete</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.title}>Choose your path.</Text>
            <Text style={styles.subtitle}>
              Select the skill track that best aligns with your travel and income goals.
            </Text>
          </View>

          <View style={styles.cardList}>
            {paths.map((path) => {
              const isSelected = selectedPath === path.id;
              return (
              <TouchableOpacity
                key={path.id}
                style={[styles.pathCard, isSelected && styles.pathCardSelected]}
                onPress={() => setSelectedPath(path.id)}
                accessibilityRole="button"
              >
                <View style={[styles.pathIcon, isSelected && styles.pathIconSelected]}>
                  <MaterialIcons
                    name={path.icon as never}
                    size={24}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                </View>
                <View style={styles.pathContent}>
                  <Text style={[styles.pathTitle, isSelected && styles.pathTitleSelected]}>
                    {path.title}
                  </Text>
                  <Text style={[styles.pathSubtitle, isSelected && styles.pathSubtitleSelected]}>
                    {path.subtitle}
                  </Text>
                </View>
                <View style={[styles.pathCheck, isSelected && styles.pathCheckSelected]}>
                  {isSelected && <MaterialIcons name="check" size={14} color="#fff" />}
                </View>
              </TouchableOpacity>
            )})}
          </View>

          <View style={styles.divider} />

          <View style={styles.hoursSection}>
            <Text style={styles.sectionTitle}>Weekly time available</Text>
            <View style={styles.hoursGrid}>
              {hoursOptions.map((option) => {
                const selected = availability === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.hoursCard, selected && styles.hoursCardSelected]}
                    onPress={() => setAvailability(option.id)}
                    accessibilityRole="button"
                  >
                    <MaterialIcons
                      name={option.icon as never}
                      size={20}
                      color={selected ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[styles.hoursLabel, selected && styles.hoursLabelSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <PrimaryButton label="Next Step" icon="arrow-forward" onPress={() => router.push('/ai-personalized-guidance')} />
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
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
    paddingTop: 12,
    paddingBottom: 12,
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
    width: '25%',
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
  cardList: {
    gap: 12,
    marginTop: 8,
  },
  pathCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: c.surface,
  },
  pathCardSelected: {
    borderColor: c.primary,
    backgroundColor: 'rgba(13,108,242,0.12)',
  },
  pathIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148,163,184,0.2)',
  },
  pathIconSelected: {
    backgroundColor: 'rgba(13,108,242,0.2)',
  },
  pathContent: {
    flex: 1,
  },
  pathTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  pathTitleSelected: {
    color: c.primary,
  },
  pathSubtitle: {
    color: c.textSecondary,
    fontSize: 12,
  },
  pathSubtitleSelected: {
    color: 'rgba(13,108,242,0.7)',
  },
  pathCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(148,163,184,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathCheckSelected: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.2)',
    marginVertical: 20,
  },
  hoursSection: {
    gap: 12,
  },
  sectionTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  hoursCard: {
    width: '47%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  hoursCardSelected: {
    borderColor: c.primary,
    backgroundColor: 'rgba(13,108,242,0.12)',
  },
  hoursLabel: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  hoursLabelSelected: {
    color: c.primary,
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
  },
});
