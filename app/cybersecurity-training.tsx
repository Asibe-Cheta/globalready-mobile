import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';

const modules = [
  {
    title: 'Module 1: Network Security & Defense',
    description: 'Fundamentals of networking, firewalls, and securing distributed infrastructure.',
    icon: 'lan',
  },
  {
    title: 'Module 2: Ethical Hacking & Pentesting',
    description: 'Advanced techniques for identifying vulnerabilities and systematic penetration testing.',
    icon: 'terminal',
  },
  {
    title: 'Module 3: Security Operations & Incident Response',
    description: 'Real-time monitoring, threat hunting, and professional remediation strategies.',
    icon: 'bolt',
  },
  {
    title: 'Module 4: Governance, Risk & Compliance',
    description: 'Regulatory frameworks, risk management, and international cybersecurity standards.',
    icon: 'policy',
  },
];

export default function CybersecurityTrainingScreen() {
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
          <Text style={styles.headerTitle}>Cybersecurity Curriculum</Text>
          <TouchableOpacity style={styles.iconButton} accessibilityRole="button">
            <MaterialIcons name="more-vert" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.title}>GlobalReady Security</Text>
            <Text style={styles.subtitle}>
              Master the skills to protect digital assets and defend against global cyber threats.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What You Will Learn</Text>
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
            <MaterialIcons name="calendar-today" size={18} color={colors.primary} />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>
                Our next free orientation session is on Saturday, Nov 2nd at 2:00 PM GMT
              </Text>
              <Text style={styles.noticeSubtitle}>
                Join our lead instructors for a live overview of the curriculum and career paths.
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
