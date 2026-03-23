import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';

const modules = [
  {
    title: 'Module 1: Advanced Excel & Data Cleaning',
    description: 'Master complex formulas, power query, and automated data preparation workflows.',
    accent: '#0d6cf2',
  },
  {
    title: 'Module 2: SQL for Data Analytics',
    description: 'Write efficient queries, join datasets, and extract meaningful patterns from databases.',
    accent: '#10b981',
  },
  {
    title: 'Module 3: PowerBI Visualization & Dashboards',
    description: 'Create interactive reports and learn the fundamentals of DAX for advanced metrics.',
    accent: '#f59e0b',
  },
  {
    title: 'Module 4: Business Intelligence Strategy',
    description: 'Bridge the gap between data and decision-making by telling stories with numbers.',
    accent: '#a855f7',
  },
];

export default function DataAnalysisTrainingScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Data Analysis & PowerBI</Text>
          <TouchableOpacity style={styles.iconButton} accessibilityRole="button">
            <MaterialIcons name="more-horiz" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.title}>Data Analysis & PowerBI</Text>
            <Text style={styles.subtitle}>
              Turn complex data into actionable business insights with industry-standard tools.
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="menu-book" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>What You Will Learn</Text>
            </View>
            <View style={styles.moduleList}>
              {modules.map((module) => (
                <View key={module.title} style={styles.moduleCard}>
                  <Text style={[styles.moduleLabel, { color: module.accent }]}>{module.title}</Text>
                  <Text style={styles.moduleDescription}>{module.description}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.noticeCard}>
            <MaterialIcons name="campaign" size={18} color={colors.primary} />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>
                Our next free orientation session is on Wednesday, Oct 30th at 6:00 PM GMT
              </Text>
              <Text style={styles.noticeSubtitle}>Join live with our industry experts</Text>
            </View>
          </View>

          <View style={styles.ctaContainer}>
            <PrimaryButton
              label="Register for orientation session"
              icon="event"
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  moduleList: {
    gap: 12,
  },
  moduleCard: {
    backgroundColor: c.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    padding: 14,
  },
  moduleLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  moduleDescription: {
    fontSize: 12,
    color: c.textSecondary,
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
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  secureText: {
    fontSize: 11,
    color: c.textSecondary,
  },
});
