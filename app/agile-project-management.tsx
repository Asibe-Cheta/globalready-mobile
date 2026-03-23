import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';

const modules = [
  {
    title: 'Module 1: Scrum & Kanban Fundamentals',
    description: 'Grasp the core principles of iterative development and visual workflow management.',
    icon: 'layers',
    accent: '#0d6cf2',
    accentBg: 'rgba(13, 108, 242, 0.2)',
  },
  {
    title: 'Module 2: Strategic Product Backlog Management',
    description: 'Master prioritization techniques and user story mapping for high-value delivery.',
    icon: 'assignment',
    accent: '#34d399',
    accentBg: 'rgba(16, 185, 129, 0.2)',
  },
  {
    title: 'Module 3: Leading Agile Ceremonies & Sprints',
    description: 'Facilitate effective dailies, reviews, and retrospectives to foster improvement.',
    icon: 'groups',
    accent: '#f59e0b',
    accentBg: 'rgba(245, 158, 11, 0.2)',
  },
  {
    title: 'Module 4: Certification Prep (PSM/CSM)',
    description: 'Prepare for global Scrum Master certifications with mock exams and guidance.',
    icon: 'workspace-premium',
    accent: '#a855f7',
    accentBg: 'rgba(168, 85, 247, 0.2)',
  },
];

export default function AgileProjectManagementScreen() {
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
          <Text style={styles.headerTitle}>Agile Project Management</Text>
          <TouchableOpacity style={styles.iconButton} accessibilityRole="button">
            <MaterialIcons name="share" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.title}>Agile Project Management</Text>
            <Text style={styles.subtitle}>
              Learn to lead high-performing teams using global Agile and Scrum frameworks.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What you will learn</Text>
            <View style={styles.moduleList}>
              {modules.map((module) => (
                <View key={module.title} style={styles.moduleCard}>
                  <View style={styles.moduleRow}>
                    <View style={[styles.moduleIcon, { backgroundColor: module.accentBg }]}>
                      <MaterialIcons name={module.icon as never} size={20} color={module.accent} />
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
                Our next free orientation session is on Thursday, Oct 31st at 4:00 PM GMT
              </Text>
              <Text style={styles.noticeSubtitle}>
                Meet the instructors and learn about the career path.
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
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 8,
  },
  hero: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: c.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    color: c.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 12,
  },
  moduleList: {
    gap: 10,
  },
  moduleCard: {
    backgroundColor: c.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    padding: 14,
  },
  moduleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  moduleIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
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
    backgroundColor: 'rgba(13, 108, 242, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(13, 108, 242, 0.3)',
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
    marginTop: 8,
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
