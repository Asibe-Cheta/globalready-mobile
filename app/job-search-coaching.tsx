import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';

const phases = [
  {
    title: 'Phase 1',
    label: 'Global CV & LinkedIn Transformation',
    icon: 'description',
    accent: '#0d6cf2',
  },
  {
    title: 'Phase 2',
    label: 'Master the Art of Networking',
    icon: 'share',
    accent: '#10b981',
  },
  {
    title: 'Phase 3',
    label: 'High-Stake Interview Preparation',
    icon: 'forum',
    accent: '#f59e0b',
  },
  {
    title: 'Phase 4',
    label: 'Salary Negotiation & Offer Review',
    icon: 'payments',
    accent: '#a855f7',
  },
];

export default function JobSearchCoachingScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Search Coaching</Text>
          <TouchableOpacity style={styles.iconButton} accessibilityRole="button">
            <MaterialIcons name="more-horiz" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.title}>Global Job Strategy</Text>
            <Text style={styles.subtitle}>
              Personalized strategies to land high-paying roles in the international job market.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What You Will Learn</Text>
            <View style={styles.phaseList}>
              {phases.map((phase) => (
                <View key={phase.title} style={styles.phaseCard}>
                  <View style={styles.phaseRow}>
                    <View style={[styles.phaseIcon, { backgroundColor: `${phase.accent}22` }]}>
                      <MaterialIcons name={phase.icon as never} size={18} color={phase.accent} />
                    </View>
                    <View style={styles.phaseContent}>
                      <Text style={[styles.phaseTitle, { color: phase.accent }]}>{phase.title}</Text>
                      <Text style={styles.phaseLabel}>{phase.label}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.noticeCard}>
            <MaterialIcons name="event" size={18} color={colors.primary} />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>
                Our next free orientation session is on Friday, Nov 1st at 1:00 PM GMT
              </Text>
              <Text style={styles.noticeSubtitle}>
                Get a detailed roadmap of the coaching program and meet the mentors.
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
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  hero: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: c.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: c.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: c.textSecondary,
    fontWeight: '700',
    marginBottom: 12,
  },
  phaseList: {
    gap: 12,
  },
  phaseCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    padding: 14,
  },
  phaseRow: {
    flexDirection: 'row',
    gap: 12,
  },
  phaseIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseContent: {
    flex: 1,
  },
  phaseTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  phaseLabel: {
    fontSize: 13,
    color: c.textPrimary,
    fontWeight: '700',
  },
  noticeCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(13,108,242,0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(13,108,242,0.3)',
    padding: 16,
    marginBottom: 18,
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
    lineHeight: 18,
  },
  ctaContainer: {
    gap: 10,
  },
  secureRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureText: {
    fontSize: 11,
    color: c.textSecondary,
  },
});
