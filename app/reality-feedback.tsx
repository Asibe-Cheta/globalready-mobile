import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';

const painPoints = [
  {
    title: 'Your CV is not tailored to international standards',
    subtitle: 'Localization Error',
    icon: 'public-off',
    color: '#f87171',
  },
  {
    title: 'Employers scan for job readiness, not certificates',
    subtitle: 'Mindset Gap',
    icon: 'fact-check',
    color: '#fbbf24',
  },
  {
    title: 'Your CV format is likely too long or irrelevant',
    subtitle: 'Formatting Issue',
    icon: 'article',
    color: '#94a3b8',
  },
];

const demandRoles = ['Cloud Architect', 'Cybersecurity Analyst', 'DevOps Engineer'];

export default function RealityFeedbackScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.glow} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={router.back}>
            <MaterialIcons name="arrow-back-ios-new" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/landing')}>
            <MaterialIcons name="home" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Why applications like yours usually fail</Text>
          <Text style={styles.subtitle}>
            Based on data from international recruiters and global hiring managers.
          </Text>

          <View style={styles.cardList}>
            {painPoints.map((item) => (
              <View key={item.title} style={styles.pointCard}>
                <View style={[styles.pointIcon, { backgroundColor: `${item.color}1A` }]}>
                  <MaterialIcons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.pointContent}>
                  <Text style={styles.pointTitle}>{item.title}</Text>
                  <Text style={styles.pointSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.highlight}>
            <Text style={styles.highlightTitle}>High-Demand Roles for You</Text>
            <Text style={styles.highlightText}>
              Based on your experience in Tech, these roles are in high demand abroad right now.
              However, you need to fix your CV to stand a chance.
            </Text>
            <View style={styles.roleTags}>
              {demandRoles.map((role) => (
                <View key={role} style={styles.roleTag}>
                  <Text style={styles.roleTagText}>{role}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.callout}>
            <View style={styles.calloutBar} />
            <Text style={styles.calloutText}>
              The first step to these roles is not a new qualification. It's about using the{' '}
              <Text style={styles.calloutAccent}>right CV strategy.</Text>
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.push('/optimizing-cv')}
          >
            <Text style={styles.ctaText}>Fix My CV & Stand Out</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(13,108,242,0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 28,
    borderRadius: 12,
    backgroundColor: c.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  title: {
    color: c.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 10,
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  cardList: {
    gap: 12,
    marginBottom: 24,
  },
  pointCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pointIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointContent: {
    flex: 1,
  },
  pointTitle: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  pointSubtitle: {
    color: c.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  highlight: {
    backgroundColor: 'rgba(13,108,242,0.08)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(13,108,242,0.2)',
    marginBottom: 20,
  },
  highlightTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  highlightText: {
    color: c.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  roleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  roleTagText: {
    color: c.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  callout: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  calloutBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: c.primary,
  },
  calloutText: {
    flex: 1,
    color: c.textPrimary,
    fontSize: 15,
    lineHeight: 20,
  },
  calloutAccent: {
    color: c.primary,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    paddingBottom: 28,
    backgroundColor: 'rgba(16,24,35,0.94)',
  },
  cta: {
    height: 56,
    borderRadius: 14,
    backgroundColor: c.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
