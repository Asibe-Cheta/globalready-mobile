import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { theme } from '@/constants/globalready-theme';
import { loadTailorCvDraft, saveTailorCvDraft } from '@/services/storage/progress';

const heroImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAS2oc2hvwMd-eWl6vzisZ3cc5dM4jPJQDL9GNRdmFpg_go_L5Nv5Jz1hfOqQnLuGJrG50_-1QPbGh-Ew-as_ZmMQS_Z4ErhXiuCa4YOWoiV2dV9Ly8TLjTYlnyALOsMU0hZsn2hMtwtwBqo4mVsgrIyiqn3WSJ03Z26FBlAJKN_VROu1fVMO2i-ozT-DoA2PPJHDN04QDSEHA1tg76lqpDsq0M-Xe2Hfb11hOM0Go9xDA7a5xmBm2a6ER6u2v4xdbX3_SEimhj9AMc';

const perks = [
  {
    title: 'Instant Job Match Score',
    icon: 'analytics',
  },
  {
    title: 'Identify critical skill gaps',
    icon: 'error-outline',
  },
  {
    title: 'Tailored CV generation',
    icon: 'description',
  },
];

export default function TailorCvIntroScreen() {
  const router = useRouter();

  useEffect(() => {
    const loadDraft = async () => {
      const draft = await loadTailorCvDraft();
      if (draft?.last_route && draft.last_route !== '/tailor-cv-intro') {
        router.replace(draft.last_route);
        return;
      }
      await saveTailorCvDraft({ last_route: '/tailor-cv-intro' });
    };

    loadDraft().catch(() => undefined);
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.push('/landing')}
            accessibilityRole="button"
          >
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.heroWrap}>
            <View style={styles.heroGlow} />
            <ImageBackground source={{ uri: heroImage }} style={styles.heroImage} imageStyle={styles.heroImageInner} />
          </View>

          <Text style={styles.title}>Check if you are fit for the job</Text>
          <Text style={styles.subtitle}>
            Paste a job description to see how well your CV matches. If it’s a good fit, we’ll help you
            generate a perfectly tailored CV for the role.
          </Text>

          <View style={styles.perkList}>
            {perks.map((perk) => (
              <View key={perk.title} style={styles.perkCard}>
                <View style={styles.perkIcon}>
                  <MaterialIcons name={perk.icon as never} size={22} color={colors.primary} />
                </View>
                <Text style={styles.perkText}>{perk.title}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomBar}>
          <PrimaryButton label="Check job fit first" onPress={() => router.push('/tailor-job-input')} />
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
    paddingTop: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  heroWrap: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroGlow: {
    position: 'absolute',
    width: '70%',
    height: '70%',
    borderRadius: 999,
    backgroundColor: 'rgba(13,108,242,0.16)',
  },
  heroImage: {
    width: '90%',
    height: '90%',
  },
  heroImageInner: {
    borderRadius: 24,
    resizeMode: 'contain',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  perkList: {
    width: '100%',
    gap: 12,
  },
  perkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  perkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13,108,242,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
  },
});
