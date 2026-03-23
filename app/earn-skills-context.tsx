import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { loadSkillsHubDraft, saveSkillsHubDraft } from '@/services/storage/progress';

const reasons = [
  {
    id: 'career-skills',
    title: 'Build a tech career',
    subtitle: 'I want to learn professional skills and grow my career',
    icon: 'school',
  },
  {
    id: 'side-hustle',
    title: 'Start a side hustle',
    subtitle: 'I want to learn skills I can monetize remotely',
    icon: 'rocket-launch',
  },
  {
    id: 'learn-german',
    title: 'Learn German',
    subtitle: 'I want to learn the German language for work or relocation',
    icon: 'translate',
  },
];

const accessOptions = [
  {
    id: 'always',
    title: 'Yes, always',
    icon: 'laptop-chromebook',
  },
  {
    id: 'sometimes',
    title: 'Sometimes',
    icon: 'wifi-tethering',
  },
];

export default function EarnSkillsContextScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const [reason, setReason] = useState('career-skills');
  const [access, setAccess] = useState('always');

  useEffect(() => {
    const loadDraft = async () => {
      const draft = await loadSkillsHubDraft();
      if (draft?.reason) setReason(draft.reason);
      if (draft?.access) setAccess(draft.access);
    };
    loadDraft().catch(() => undefined);
  }, []);

  useEffect(() => {
    saveSkillsHubDraft({
      last_route: '/earn-skills-context',
      reason,
      access,
    }).catch(() => undefined);
  }, [reason, access]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Context</Text>
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
            <Text style={styles.progressStep}>Step 2 of 5</Text>
            <Text style={styles.progressLabel}>Earn Skills Path</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.title}>Let's set your context.</Text>
            <Text style={styles.subtitle}>
              Help us tailor your Global Hustle plan by understanding your current situation and resources.
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>1</Text>
              </View>
              <Text style={styles.sectionTitle}>Why are you here?</Text>
            </View>

            <View style={styles.optionList}>
              {reasons.map((item) => {
                const selected = reason === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                    onPress={() => setReason(item.id)}
                    accessibilityRole="button"
                  >
                    <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                      <MaterialIcons
                        name={item.icon as never}
                        size={22}
                        color={selected ? colors.primary : colors.textSecondary}
                      />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.optionSubtitle, selected && styles.optionSubtitleSelected]}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>2</Text>
              </View>
              <Text style={styles.sectionTitle}>Laptop + Internet?</Text>
            </View>

            <View style={styles.grid}>
              {accessOptions.map((item) => {
                const selected = access === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.gridCard, selected && styles.gridCardSelected]}
                    onPress={() => setAccess(item.id)}
                    accessibilityRole="button"
                  >
                    <MaterialIcons
                      name={item.icon as never}
                      size={28}
                      color={selected ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[styles.gridTitle, selected && styles.gridTitleSelected]}>{item.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <PrimaryButton label="Continue" icon="arrow-forward" onPress={() => router.push('/earn-skills-logistics')} />
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
    paddingTop: 4,
    paddingBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStep: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressLabel: {
    color: c.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '40%',
    height: '100%',
    backgroundColor: c.primary,
    borderRadius: 999,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 160,
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
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(13,108,242,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeText: {
    color: c.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  optionList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  optionCardSelected: {
    borderColor: c.primary,
    backgroundColor: 'rgba(13,108,242,0.12)',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148,163,184,0.12)',
  },
  optionIconSelected: {
    backgroundColor: 'rgba(13,108,242,0.2)',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: c.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: c.primary,
  },
  optionSubtitle: {
    color: c.textSecondary,
    fontSize: 12,
  },
  optionSubtitleSelected: {
    color: c.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  gridCardSelected: {
    borderColor: c.primary,
    backgroundColor: 'rgba(13,108,242,0.12)',
  },
  gridTitle: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  gridTitleSelected: {
    color: c.primary,
  },
  bottomBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
  },
});
