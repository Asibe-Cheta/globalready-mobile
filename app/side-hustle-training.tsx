import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';

const modules = [
  {
    title: 'Module 1: Vibe Coding & No-Code',
    description: 'Build functional web apps and tools without writing traditional code.',
    icon: 'extension',
  },
  {
    title: 'Module 2: AI & Digital Products',
    description: 'Leverage AI to create and launch profitable digital assets and automated workflows.',
    icon: 'smart-toy',
  },
  {
    title: 'Module 3: Content Creation & Video Editing',
    description: 'Master high-impact storytelling, short-form video, and viral content strategies.',
    icon: 'video-library',
  },
  {
    title: 'Module 4: Virtual Assistance & Ops',
    description: 'Professional management, email systems, and remote executive support mastery.',
    icon: 'support-agent',
  },
];

export default function SideHustleTrainingScreen() {
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
          <Text style={styles.headerTitle}>Side Hustle Hub</Text>
          <TouchableOpacity style={styles.iconButton} accessibilityRole="button">
            <MaterialIcons name="more-vert" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.title}>High-Income Paths</Text>
            <Text style={styles.subtitle}>
              Learn high-demand digital skills to start earning and funding your career journey.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What you will learn</Text>
            <View style={styles.moduleList}>
              {modules.map((module) => (
                <View key={module.title} style={styles.moduleCard}>
                  <View style={styles.moduleRow}>
                    <View style={styles.moduleIcon}>
                      <MaterialIcons name={module.icon as never} size={20} color={colors.primary} />
                    </View>
                    <View style={styles.moduleContent}>
                      <Text style={styles.moduleTitle}>{module.title}</Text>
                      <Text style={styles.moduleDescription}>{module.description}</Text>
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
                Our next free orientation session is on Monday, Oct 28th at 7:00 PM GMT
              </Text>
              <Text style={styles.noticeSubtitle}>
                Join our lead mentors for a live overview of the curriculum and monetization strategies.
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
              <MaterialIcons name="shield" size={14} color={colors.textSecondary} />
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
    color: c.primary,
    fontWeight: '700',
    marginBottom: 12,
  },
  moduleList: {
    gap: 12,
  },
  moduleCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    padding: 14,
  },
  moduleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  moduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(13,108,242,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitle: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  moduleDescription: {
    color: c.textSecondary,
    fontSize: 12,
    lineHeight: 18,
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
    paddingBottom: 12,
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
