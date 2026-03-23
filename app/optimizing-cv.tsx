import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { theme } from '@/constants/globalready-theme';

const reasons = [
  {
    title: 'Your CV is not tailored to international standards',
    subtitle: 'Localization Error',
    icon: 'public-off',
    color: '#ef4444',
  },
  {
    title: 'Employers scan for job readiness, not certificates',
    subtitle: 'Mindset Gap',
    icon: 'fact-check',
    color: '#f59e0b',
  },
  {
    title: 'Your CV format is likely too long or irrelevant',
    subtitle: 'Formatting Issue',
    icon: 'article',
    color: '#94a3b8',
  },
];

const roles = ['Cloud Architect', 'Cybersecurity Analyst', 'DevOps Engineer'];

export default function OptimizingCvScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.stepDots}>
            <View style={styles.dot} />
            <View style={styles.dotWide} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/landing')}
            accessibilityRole="button"
          >
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.title}>Why applications like yours usually fail</Text>
            <Text style={styles.subtitle}>
              Based on data from international recruiters and global hiring managers.
            </Text>
          </View>

          <View style={styles.reasonList}>
            {reasons.map((item) => (
              <View key={item.title} style={styles.reasonCard}>
                <View style={[styles.reasonIcon, { backgroundColor: `${item.color}22` }]}>
                  <MaterialIcons name={item.icon as never} size={22} color={item.color} />
                </View>
                <View style={styles.reasonContent}>
                  <Text style={styles.reasonTitle}>{item.title}</Text>
                  <Text style={styles.reasonSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.rolesCard}>
            <Text style={styles.rolesTitle}>High-Demand Roles for You</Text>
            <Text style={styles.rolesSubtitle}>
              Based on your experience in Tech, these roles are in high demand abroad right now.
              However, you need to fix your CV to stand a chance.
            </Text>
            <View style={styles.rolesWrap}>
              {roles.map((role) => (
                <View key={role} style={styles.rolePill}>
                  <Text style={styles.roleText}>{role}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.callout}>
            <View style={styles.calloutBar} />
            <Text style={styles.calloutText}>
              The first step to these roles is not a new qualification. It’s about using the{' '}
              <Text style={styles.calloutAccent}>right CV strategy.</Text>
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <PrimaryButton
            label="Fix My CV & Stand Out"
            icon="arrow-forward"
            onPress={() => router.push('/cv-builder-offer')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const colors = theme.colors;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  stepDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(148,163,184,0.5)',
  },
  dotWide: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 200,
  },
  hero: {
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  reasonList: {
    gap: 12,
    marginBottom: 20,
  },
  reasonCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  reasonIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonContent: {
    flex: 1,
  },
  reasonTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  reasonSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rolesCard: {
    backgroundColor: 'rgba(13,108,242,0.12)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(13,108,242,0.25)',
    marginBottom: 20,
  },
  rolesTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  rolesSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  rolesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rolePill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  roleText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  callout: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  calloutBar: {
    width: 4,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  calloutText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  calloutAccent: {
    color: colors.primary,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: 'rgba(16,23,34,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
