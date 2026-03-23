import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { PrimaryButton } from '@/components/ui/primary-button';

const levels = [
  {
    code: 'A1',
    title: 'Beginner',
    description:
      'For beginners with no prior knowledge. Learn to introduce yourself and handle simple daily interactions.',
    accent: '#0d6cf2',
    accentBg: 'rgba(13,108,242,0.2)',
  },
  {
    code: 'A2',
    title: 'Basic Communication',
    description:
      'Master basic sentences and frequently used expressions related to areas of most immediate relevance.',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.2)',
  },
  {
    code: 'B1',
    title: 'Intermediate Usage',
    description:
      'Understand main points of clear standard input on familiar matters and handle most travel situations.',
    accent: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.2)',
  },
  {
    code: 'B2',
    title: 'Professional Proficiency',
    description:
      'Communicate fluently and spontaneously for professional and academic contexts without strain.',
    accent: '#a855f7',
    accentBg: 'rgba(168,85,247,0.2)',
  },
];

export default function GermanLanguageProgramsScreen() {
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
          <Text style={styles.headerTitle}>German Language Programs</Text>
          <TouchableOpacity style={styles.iconButton} accessibilityRole="button">
            <MaterialIcons name="info" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.title}>Curriculum Levels</Text>
            <Text style={styles.subtitle}>
              Explore our standardized German language training levels designed for your success
              abroad.
            </Text>
          </View>

          <View style={styles.levelList}>
            {levels.map((level) => (
              <View key={level.code} style={styles.levelCard}>
                <View style={styles.levelRow}>
                  <View style={[styles.levelBadge, { backgroundColor: level.accentBg }]}>
                    <Text style={[styles.levelCode, { color: level.accent }]}>{level.code}</Text>
                  </View>
                  <Text style={styles.levelTitle}>{level.title}</Text>
                </View>
                <Text style={styles.levelDescription}>{level.description}</Text>
              </View>
            ))}
          </View>

          <View style={styles.noticeCard}>
            <MaterialIcons name="event" size={18} color={colors.primary} />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>
                Our next free information session is on Saturday, October 26th at 10:00 AM GMT
              </Text>
              <Text style={styles.noticeSubtitle}>
                Learn about visa requirements, enrollment, and relocation.
              </Text>
            </View>
          </View>

          <View style={styles.ctaContainer}>
            <PrimaryButton
              label="Register for a free information session"
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
    paddingTop: 8,
  },
  hero: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: c.textSecondary,
    lineHeight: 22,
  },
  levelList: {
    gap: 10,
    marginBottom: 20,
  },
  levelCard: {
    backgroundColor: c.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    padding: 14,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelCode: {
    fontSize: 12,
    fontWeight: '700',
  },
  levelTitle: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  levelDescription: {
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
  },
  ctaContainer: {
    gap: 12,
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
