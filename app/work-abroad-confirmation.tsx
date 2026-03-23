import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { useAssessment } from '@/contexts/AssessmentContext';

export default function WorkAbroadConfirmationScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { resumeRoute, hasDraft, resetAssessment } = useAssessment();

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back-ios-new" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GlobalReady</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/landing')} accessibilityRole="button">
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.copy}>
            <Text style={styles.title}>Choose Your Path</Text>
            <Text style={styles.subtitle}>Find remote tech roles and prepare to land them.</Text>
          </View>

          <View style={styles.cardList}>
            <TouchableOpacity
              style={styles.pathCard}
              onPress={() => router.push('/jobs-feed')}
              accessibilityRole="button"
            >
              <ImageBackground
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjF9MmDCv61EtZ3aUncW9LBjEwHbk-VxgXK1-0azTbUI-Cj_dvqAda6v3CU0eVWUiedF0ZXJiIBKoKLF4xtEGa2dTKlimHYedTdIqv6YzWBK-z7xJ6RhtN5xhexCQA4etLuahA-FAUYB2al9UtYTs3L3AM4oYHUK0KW_KPkckafySeFUtODDSjybqukVgURjQiaZj8Xn_hxkvvvaM826Gfd5Sc3XrIK8hah0JR2Wq8LSPbhRXFwX57vH3gFs2jFxrKnru9LAHUfkP_',
                }}
                style={styles.pathImage}
                imageStyle={styles.pathImageInner}
              >
                <View style={styles.pathOverlay} />
                <View style={styles.pathIcon}>
                  <MaterialIcons name="search" size={20} color="#fff" />
                </View>
              </ImageBackground>
              <View style={styles.pathBody}>
                <Text style={styles.pathTitle}>Browse Jobs</Text>
                <View style={styles.pathFooter}>
                  <Text style={styles.pathSubtitle}>Explore global opportunities in tech companies.</Text>
                  <PrimaryButton label="Explore" onPress={() => router.push('/jobs-feed')} />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pathCard}
              onPress={() => router.push('/cv-status-questionnaire')}
              accessibilityRole="button"
            >
              <ImageBackground
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAV5fEZ8cJG-so42qVT48W2DUX1DH8LNrUfen4kF7U4AR5f8Mqg0LMlrsrm4g6ZCwun_sxB3BSxhXz1_h9tGIMw0jgbzAsQNAfTOOmtiDwv05pgbYllyQIB1v-rQhnqVnNCkbyQ2jM7OOQESpr7GiWChnuuyZ-KFFmtn2lC3TuFu4oC8hxJpbcIHvza8xncQx-zdbciWPdGU9oXCJ8BMLJ2EMKe4IVeSExBw4W1MK3c5q5-4XH1BMsv2gBmH0Fhp9yBhCCR--fcizgj',
                }}
                style={styles.pathImage}
                imageStyle={styles.pathImageInner}
              >
                <View style={styles.pathOverlay} />
                <View style={styles.pathIcon}>
                  <MaterialIcons name="work" size={20} color="#fff" />
                </View>
              </ImageBackground>
              <View style={styles.pathBody}>
                <Text style={styles.pathTitle}>Get Job-Ready</Text>
                <View style={styles.pathFooter}>
                  <Text style={styles.pathSubtitle}>Assess your skills and prepare for global interviews.</Text>
                  <PrimaryButton label="Get Started" onPress={() => router.push('/cv-status-questionnaire')} />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {hasDraft && resumeRoute ? (
            <View style={styles.resumeCard}>
              <View style={styles.resumeHeaderRow}>
                <View style={styles.resumeTextWrap}>
                  <Text style={styles.resumeTitle}>Resume Work Abroad Assessment</Text>
                  <Text style={styles.resumeSubtitle}>Continue where you left off.</Text>
                </View>
                <TouchableOpacity
                  style={styles.resumeDismissButton}
                  onPress={() => resetAssessment()}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss resume"
                >
                  <MaterialIcons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <PrimaryButton label="Resume Assessment" icon="arrow-forward" onPress={() => router.push(resumeRoute as any)} />
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  headerTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    paddingTop: 12,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: c.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  cardList: {
    gap: 16,
  },
  pathCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: c.surface,
  },
  pathImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'flex-start',
  },
  pathImageInner: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  pathOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  pathIcon: {
    marginTop: 12,
    marginLeft: 12,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathBody: {
    padding: 16,
    gap: 10,
  },
  pathTitle: {
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  pathFooter: {
    gap: 12,
  },
  pathSubtitle: {
    color: c.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  resumeCard: {
    marginTop: 16,
    backgroundColor: c.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 12,
  },
  resumeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  resumeTextWrap: {
    flex: 1,
  },
  resumeDismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  resumeTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  resumeSubtitle: {
    color: c.textSecondary,
    fontSize: 12,
  },
});
