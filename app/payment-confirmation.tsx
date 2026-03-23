import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { ProSuggestionModal } from '@/components/ProSuggestionModal';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useProPrompt } from '@/hooks/useProPrompt';
import { theme } from '@/constants/globalready-theme';

const heroImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuArleAZPSc8tDw7hKvX8vW8F2jbZarZueUE1t3ZdbS5PYK9Lq2F94w6kMH5tL60aLyr1DggWEFyD2ziGw1mG-EwREPTCWjH8TbKg-cpbDWoyi91BGwjbKVCFGhea1J8j-IlUZrD_exJgeu4miTe9MZGkTngcsGtTnzlS8--WU3dT5ta-UHZySxYEFTZABQbB39g93Uy5YHqRqJpL4LCbWYmm7a5pYeQ_p-rs4CML44nt1uYeoP65dpJTvw5czUmU4SuyWhgn0zXQkAZ';

export default function PaymentConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isPro } = useSubscription();
  const { shouldShowProPrompt, markProPromptShown } = useProPrompt();
  const [showProModal, setShowProModal] = useState(false);

  const cvId = params.cvId as string;

  useEffect(() => {
    if (isPro) return;
    shouldShowProPrompt('pro_after_tailor_payment').then((show) => {
      if (show) setShowProModal(true);
    });
  }, [isPro, shouldShowProPrompt]);
  const amount = parseInt(params.amount as string) || 500;
  const sessionId = params.sessionId as string;

  const shortRef = sessionId
    ? `#${sessionId.slice(-8).toUpperCase()}`
    : '#GR-' + Math.floor(1000 + Math.random() * 9000);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Confirmation</Text>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.hero}>
            <ImageBackground source={{ uri: heroImage }} style={styles.heroImage} imageStyle={styles.heroImageInner} />
            <Text style={styles.heroTitle}>CV Tailored Successfully!</Text>
            <Text style={styles.heroSubtitle}>
              Your optimized CV is now ready for download. Good luck with your application!
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item</Text>
              <Text style={styles.summaryValue}>Job-Specific CV Tailoring</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Transaction ID</Text>
              <Text style={styles.summaryValue}>{shortRef}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Method</Text>
              <View style={styles.paymentRow}>
                <MaterialIcons name="credit-card" size={16} color={colors.textPrimary} />
                <Text style={styles.summaryValue}>Stripe Checkout</Text>
              </View>
            </View>
            <View style={styles.summaryRowLast}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={styles.summaryTotal}>${(amount / 100).toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label="Download CV Now"
              icon="download"
              onPress={() => router.push({ pathname: '/download-cv', params: { cvId } })}
            />
            <SecondaryButton label="Tailor another CV" icon="edit-document" onPress={() => router.push('/tailor-cv-intro')} />
            <SecondaryButton
              label="Check out our Course catalog of High income career skills"
              icon="school"
              onPress={() => router.push('/course-catalog')}
            />
            <TouchableOpacity onPress={() => router.push('/landing')} accessibilityRole="button">
              <Text style={styles.returnText}>Return to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ProSuggestionModal
        visible={showProModal}
        message="Loved that tailored CV? With Pro, every tailor is included—no per-CV fee."
        onSeePro={() => router.push('/billing')}
        onDismiss={() => {
          setShowProModal(false);
          markProPromptShown('pro_after_tailor_payment');
        }}
      />
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  hero: {
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  heroImage: {
    width: 128,
    height: 128,
    marginBottom: 8,
  },
  heroImageInner: {
    borderRadius: 64,
    resizeMode: 'cover',
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  summaryCard: {
    marginTop: 18,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  summaryTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.2)',
  },
  summaryRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryTotal: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actions: {
    marginTop: 16,
    gap: 10,
  },
  returnText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
