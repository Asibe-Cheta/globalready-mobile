import { MaterialIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { useCVBuilder } from '@/hooks/useCVBuilder';

const benefits = [
  'Country-specific CV structure',
  'Guided questions (no blank page)',
  'ATS-safe format',
  'Instant PDF download',
];

export default function CvBuilderOfferScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { isPro } = useSubscription();
  const { currentStep, draftLoaded, draftExists } = useCVBuilder();

  const resumeRoute = useMemo(() => {
    const stepRouteMap: Record<number, string> = {
      1: '/cv-personal-details',
      2: '/cv-skills-availability',
      3: '/cv-work-experience',
      4: '/cv-education',
      5: '/cv-certifications',
    };
    return stepRouteMap[currentStep] || '/cv-personal-details';
  }, [currentStep]);

  const handleStart = () => {
    if (draftLoaded && draftExists && currentStep > 1) {
      router.push(resumeRoute);
      return;
    }
    router.push('/cv-personal-details');
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GLOBAL HUSTLE OS</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/landing')} accessibilityRole="button">
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <MaterialIcons name="description" size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>Create the correct CV and download it on your phone</Text>
          <Text style={styles.subtitle}>
            Get hired faster with a professional resume tailored for international opportunities.
          </Text>

          <View style={styles.benefits}>
            {benefits.map((benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <MaterialIcons name="check-circle" size={16} color={colors.primary} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <View style={styles.priceRow}>
            {isPro ? (
              <>
                <MaterialIcons name="check-circle" size={20} color="#16a34a" />
                <Text style={[styles.priceNote, { color: '#16a34a', fontWeight: '700' }]}>Included in your Pro plan</Text>
              </>
            ) : (
              <>
                <Text style={styles.price}>€5</Text>
                <Text style={styles.priceNote}>One-time payment</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label={draftLoaded && draftExists ? 'Resume My CV' : 'Create My CV'}
            icon="arrow-forward"
            onPress={handleStart}
          />
          <TouchableOpacity onPress={router.back} accessibilityRole="button">
            <Text style={styles.noThanks}>No thanks</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 14,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(13,108,242,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: c.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  benefits: {
    gap: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  priceRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    color: c.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  priceNote: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    gap: 12,
  },
  noThanks: {
    textAlign: 'center',
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
