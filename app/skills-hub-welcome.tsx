import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { loadSkillsHubDraft, saveSkillsHubDraft } from '@/services/storage/progress';

const HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAzm26ZXGh48AOZolFuQAGi1KyIUa2TJ3vlXQW1A3kpRMGx3ehWo34tu-qfBv743CY-vPcVbZx8VYtZW555CYrQOavdh7bEWhc9knbKrSG2ZIky4X6P0kmGVMR76_Ub3PbJw3_0lllRml3CPSkxSHloGhLbfoFBmzyYNi3F-eJEJ_teuy9Xuanm8bl7fSorJT3Y_8dA9bk4jwlyTEMPffVz_9A2-dFidrEr6VmPIxzkuksbNJz3HG6wHEO2f2DoMmHaa2P7sihON3tQ';

const avatars = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBWCFLA9cr_SMhMtNrY5CXAygjq1kPJy6GKA-YS8zRFqr9fEklOTFg05m0VL2ZDR_0Fsj1AmA4V8AqS_pwEqyWaO6MR_U2FdOAiTF-dD3KA6-Yhj72PeGB7BKE976XLtUFKCQqRyq1xVFAw5p4-YfQ48nq10nP6XE6X2qkDTEq6OeSyk3Tbv9kK0vmIuUtSASUef6itYyAFDPEAGcWoS37rgA_kny8jU9XccqR7R_ghnDJfOicuBwlna8aLFSpUrR1qLs_c1tk1X75D',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDjSvhEDhmoRfOHiQgkXabK7vqmmw11vSJxE0VjyMJgIXwp_4TgK7KuczfQWmQ0g75SYGwlLG9K75osnYoUJX6WIAFxKV3ENaalMYLyURI8-zQG6EDND6MB-1VOdpR-tpwVi6v17zmJPU-oEzAtrKISz6HhYZL4RZqEGDJpU1VtwAxKZKKnISQlOg2eyg2d0IFP9z_1dOk0tdL-LReoiPbnKV4Zs-4vm4qM4cAB3YQFCSYhTjsTKr34-hwsyOU5dlfhS3fBG_cppVL2',
];

export default function SkillsHubWelcomeScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();

  useEffect(() => {
    saveSkillsHubDraft({ last_route: '/skills-hub-welcome' }).catch(() => undefined);
  }, []);

  return (
    <Screen>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.glowTop} />
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.push('/landing')}
            accessibilityRole="button"
          >
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.badge}>
          <MaterialIcons name="rocket-launch" size={18} color={colors.primary} />
          <Text style={styles.badgeText}>GLOBAL HUSTLE OS</Text>
        </View>

        <View style={styles.heroWrap}>
          <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.heroImage} imageStyle={styles.heroImageInner}>
            <View style={styles.heroOverlay} />
            <View style={styles.heroFooter}>
              <View style={styles.avatarRow}>
                <View style={styles.avatarStack}>
                  {avatars.map((uri, index) => (
                    <View key={uri} style={[styles.avatar, { marginLeft: index === 0 ? 0 : -8 }]}>
                      <ImageBackground source={{ uri }} style={styles.avatarImage} />
                    </View>
                  ))}
                  <View style={styles.avatarCount}>
                    <Text style={styles.avatarCountText}>+2k</Text>
                  </View>
                </View>
                <Text style={styles.avatarLabel}>Active learners worldwide</Text>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>
            Welcome to the <Text style={styles.titleAccent}>Career & High demand Income skills Hub</Text>
          </Text>
          <Text style={styles.subtitle}>
            Unlock structured lessons, live guidance, and 24/7 support to master the skills you need for your work or study abroad journey.
          </Text>
        </View>

        <View style={styles.bottomBar}>
          <PrimaryButton
            label="Let's Get Started"
            icon="arrow-forward"
            onPress={() => router.push('/skills-hub-features')}
          />
          <Text style={styles.bottomNote}>Start your journey today. No credit card required.</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(13,108,242,0.2)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 20,
  },
  badgeText: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroImage: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 4 / 5,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroImageInner: {
    borderRadius: 20,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16,24,35,0.45)',
  },
  heroFooter: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarImage: {
    flex: 1,
  },
  avatarCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  avatarCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  avatarLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  copy: {
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  title: {
    color: c.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  titleAccent: {
    color: c.primary,
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    gap: 10,
  },
  bottomNote: {
    textAlign: 'center',
    color: c.textSecondary,
    fontSize: 11,
  },
});
