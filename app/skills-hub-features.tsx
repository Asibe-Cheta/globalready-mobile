import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { saveSkillsHubDraft } from '@/services/storage/progress';

const features = [
  {
    title: 'Structured Lessons',
    description: 'Detailed, easy-to-follow curriculum.',
    icon: 'menu-book',
  },
  {
    title: 'Live Guidance',
    description: 'Access to experts and mentors.',
    icon: 'support-agent',
  },
  {
    title: 'CV and Job Search Coaching',
    description: 'Personalized help with documents and strategies.',
    icon: 'assignment',
  },
  {
    title: 'High Demand Career Income Skills',
    description: 'Learn skills to fund your travel aspirations.',
    icon: 'paid',
  },
  {
    title: 'Structured Step-by-Step Execution Plan',
    description: 'A clear, actionable roadmap to reach your goals.',
    icon: 'checklist',
  },
];

export default function SkillsHubFeaturesScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();

  useEffect(() => {
    saveSkillsHubDraft({ last_route: '/skills-hub-features' }).catch(() => undefined);
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Skills Hub</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/landing')}
            accessibilityRole="button"
          >
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.progressRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.title}>Welcome to The Global Ready Professional/Income Skills Hub</Text>
          <Text style={styles.subtitle}>
            Your toolkit for going global. Everything you need to land your opportunity abroad.
          </Text>
        </View>

        <View style={styles.cardList}>
          {features.map((feature) => (
            <View key={feature.title} style={styles.card}>
              <View style={styles.cardIcon}>
                <MaterialIcons name={feature.icon as never} size={24} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{feature.title}</Text>
                <Text style={styles.cardSubtitle}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomBar}>
          <PrimaryButton label="Next" icon="arrow-forward" onPress={() => router.push('/earn-skills-context')} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(148,163,184,0.3)',
  },
  dotActive: {
    width: 32,
    borderRadius: 8,
    backgroundColor: c.primary,
  },
  hero: {
    gap: 10,
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: c.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: c.textSecondary,
  },
  cardList: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13,108,242,0.15)',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: c.textSecondary,
  },
  bottomBar: {
    marginTop: 24,
  },
});
