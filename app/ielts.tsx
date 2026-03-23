import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { AppHeader } from '@/components/ui/app-header';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';

const modules = [
  {
    phase: 'Phase 1',
    title: 'Master the Listening Module',
    description:
      'Techniques for all 4 parts, including accent familiarization and note-taking.',
    icon: 'hearing',
    accent: '#0d6cf2',
    accentBg: 'rgba(13, 108, 242, 0.2)',
  },
  {
    phase: 'Phase 2',
    title: 'High-Scoring Reading Tactics',
    description: 'Skimming, scanning, and identifying key information under time pressure.',
    icon: 'menu-book',
    accent: '#22c55e',
    accentBg: 'rgba(34, 197, 94, 0.2)',
  },
  {
    phase: 'Phase 3',
    title: 'Academic & General Writing',
    description: 'Master Task 1 and Task 2 with advanced vocabulary and cohesive structures.',
    icon: 'edit-note',
    accent: '#f59e0b',
    accentBg: 'rgba(245, 158, 11, 0.2)',
  },
  {
    phase: 'Phase 4',
    title: 'Fluent Speaking & Interview Prep',
    description: 'Build confidence with real mock tests and personalized feedback on pronunciation.',
    icon: 'record-voice-over',
    accent: '#a855f7',
    accentBg: 'rgba(168, 85, 247, 0.2)',
  },
];

export default function IeltsScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();

  return (
    <Screen>
      <AppHeader
        title="IELTS Preparation"
        onBack={router.back}
        right={
          <TouchableOpacity accessibilityRole="button">
            <MaterialIcons name="more-horiz" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>IELTS Mastery Strategy</Text>
          <Text style={styles.subtitle}>
            Achieve your target band score for work, study, and global relocation.
          </Text>
        </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What you will learn</Text>
            <View style={styles.moduleList}>
              {modules.map((module) => (
                <View key={module.phase} style={styles.moduleCard}>
                  <View style={styles.moduleRow}>
                    <View style={[styles.moduleIcon, { backgroundColor: module.accentBg }]}>
                      <MaterialIcons name={module.icon as never} size={20} color={module.accent} />
                    </View>
                    <View style={styles.moduleContent}>
                      <Text style={[styles.modulePhase, { color: module.accent }]}>
                        {module.phase.toUpperCase()}
                      </Text>
                      <Text style={styles.moduleTitle}>{module.title}</Text>
                      <Text style={styles.moduleDescription}>{module.description}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.noticeCard}>
            <MaterialIcons name="calendar-today" size={18} color={colors.primary} />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>
                Our next free orientation session is on Tuesday, Nov 5th at 5:00 PM GMT
              </Text>
              <Text style={styles.noticeSubtitle}>
                Live Q&A with certified examiners and detailed curriculum breakdown.
              </Text>
            </View>
          </View>

        <View style={styles.ctaContainer}>
          <PrimaryButton
            label="Register for orientation session"
            icon="arrow-forward"
            onPress={() => router.push('/hub-info-session')}
          />
          <View style={styles.secureRow}>
            <MaterialIcons name="lock" size={14} color={colors.textSecondary} />
            <Text style={styles.secureText}>Your data is secure & private</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  hero: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: c.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    color: `${c.textSecondary}99`,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 16,
  },
  moduleList: {
    gap: 12,
  },
  moduleCard: {
    backgroundColor: c.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    padding: 16,
  },
  moduleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  moduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleContent: {
    flex: 1,
  },
  modulePhase: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 6,
  },
  moduleDescription: {
    fontSize: 13,
    color: c.textSecondary,
    lineHeight: 18,
  },
  noticeCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(13, 108, 242, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(13, 108, 242, 0.3)',
    padding: 16,
    marginBottom: 28,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textPrimary,
    marginBottom: 6,
  },
  noticeSubtitle: {
    fontSize: 12,
    color: c.textSecondary,
    lineHeight: 16,
  },
  ctaContainer: {
    gap: 14,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    opacity: 0.7,
  },
  secureText: {
    color: c.textSecondary,
    fontSize: 12,
  },
});
