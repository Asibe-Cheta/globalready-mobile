import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { theme } from '@/constants/globalready-theme';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { loadSkillsHubDraft } from '@/services/storage/progress';

type PathCardProps = {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconBg: string;
  accent: string;
  onPress: () => void;
  cardBorderColor: string;
  cardBg: string;
  cardTitleColor: string;
  styles: { cardContent: object; cardIcon: object; cardTitle: object };
};

function PathCard({ title, icon, iconBg, accent, onPress, cardBorderColor, cardBg, cardTitleColor, styles: s }: PathCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: pressed ? accent : cardBorderColor, backgroundColor: cardBg },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
      accessibilityRole="button"
    >
      <View style={s.cardContent}>
        <View style={[s.cardIcon, { backgroundColor: iconBg }]}>
          <MaterialIcons name={icon} size={24} color={accent} />
        </View>
        <Text style={[s.cardTitle, { color: cardTitleColor }]}>{title}</Text>
      </View>
      <MaterialIcons name="arrow-forward" size={20} color={accent} />
    </Pressable>
  );
}

export default function LandingScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const [workAbroadRoute, setWorkAbroadRoute] = useState<string | null>(null);
  const [skillsHubRoute, setSkillsHubRoute] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const loadLastRoute = async () => {
      const workDraft = await AsyncStorage.getItem('gr_work_abroad_draft');
      if (workDraft) {
        const parsed = JSON.parse(workDraft);
        setWorkAbroadRoute(parsed.last_route || null);
      }

      const skillsDraft = await loadSkillsHubDraft();
      setSkillsHubRoute(skillsDraft?.last_route || null);

    };

    loadLastRoute().catch(() => undefined);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Screen>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundLayer}>
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
        >
          <MaterialIcons name="person" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.ghPill}>
          <Text style={styles.ghText}>GH-OS</Text>
        </View>

        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>Welcome to GlobalReady</Text>
          <Text style={styles.subtitle}>
            Choose a path to get started or continue your progress.
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {workAbroadRoute && workAbroadRoute !== '/work-abroad-confirmation' ? (
          <View style={styles.continueCard}>
            <View style={styles.continueHeaderRow}>
              <View style={styles.continueTextWrap}>
                <Text style={styles.continueTitle}>Resume Work Abroad Assessment</Text>
                <Text style={styles.continueSubtitle}>Continue where you left off.</Text>
              </View>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={async () => {
                  await AsyncStorage.removeItem('gr_work_abroad_draft');
                  setWorkAbroadRoute(null);
                }}
                accessibilityRole="button"
              >
                <MaterialIcons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <PrimaryButton
              label="Resume"
              icon="arrow-forward"
              onPress={() => router.push(workAbroadRoute)}
              style={styles.continueButton}
            />
          </View>
        ) : null}

        {skillsHubRoute && skillsHubRoute !== '/skills-hub-welcome' ? (
          <View style={styles.continueCard}>
            <View style={styles.continueHeaderRow}>
              <View style={styles.continueTextWrap}>
                <Text style={styles.continueTitle}>Resume Skills Hub</Text>
                <Text style={styles.continueSubtitle}>Pick up where you stopped.</Text>
              </View>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={async () => {
                  await AsyncStorage.removeItem('gr_skills_hub_draft');
                  setSkillsHubRoute(null);
                }}
                accessibilityRole="button"
              >
                <MaterialIcons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <PrimaryButton
              label="Resume"
              icon="arrow-forward"
              onPress={() => router.push(skillsHubRoute)}
              style={styles.continueButton}
            />
          </View>
        ) : null}
        </Animated.View>

        <Animated.View style={[styles.list, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <PathCard
            title="Work Abroad"
            icon="work"
            iconBg="rgba(13, 108, 242, 0.12)"
            accent={theme.colors.primary}
            cardBorderColor={colors.navBorder}
            cardBg={colors.surface}
            cardTitleColor={colors.textPrimary}
            onPress={() => router.push('/work-abroad-confirmation')}
            styles={styles}
          />
          <PathCard
            title="Learn a Professional Skill or Side Hustle"
            icon="computer"
            iconBg="rgba(16, 185, 129, 0.12)"
            accent="#10b981"
            cardBorderColor={colors.navBorder}
            cardBg={colors.surface}
            cardTitleColor={colors.textPrimary}
            onPress={() => router.push('/skills-hub-welcome')}
            styles={styles}
          />
        </Animated.View>

        <Text style={styles.footer}>GlobalReady v1.0</Text>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: 40,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: -120,
    right: -120,
    height: 320,
    borderRadius: 200,
    backgroundColor: 'rgba(13, 108, 242, 0.12)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -140,
    left: -120,
    right: -120,
    height: 280,
    borderRadius: 200,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  ghPill: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.navBorder,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: theme.spacing.lg,
  },
  profileButton: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.navBorder,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ghText: {
    color: c.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    color: c.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  list: {
    gap: 14,
  },
  continueCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  continueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  continueTextWrap: {
    gap: 6,
    flex: 1,
  },
  continueTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  continueSubtitle: {
    color: c.textSecondary,
    fontSize: 12,
  },
  continueButton: {
    width: '100%',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  footer: {
    marginTop: 28,
    marginBottom: 16,
    textAlign: 'center',
    color: c.textSecondary,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
