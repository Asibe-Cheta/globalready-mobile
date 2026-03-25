import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { theme } from '@/constants/globalready-theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { sendPaymentConfirmationEmail } from '@/services/email/sendgrid';
import { analytics } from '@/utils/analytics';

const APP_SCHEME = 'globalreadymobile';

export default function CompletePurchaseScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get params with defaults
  const cvId = (params.cvId as string) || '';
  const amount = parseInt(params.amount as string) || 500; // Default €5 (in cents)
  const jobDescription = params.jobDescription as string;
  const serviceType = (params.serviceType as string) || 'cv_tailoring';

  const handlePayment = async () => {
    if (!cvId) {
      Alert.alert('Error', 'CV ID is missing');
      return;
    }

    setLoading(true);

    try {
      analytics.paymentStarted(amount, cvId);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Build deep link URLs for Stripe redirect
      const successUrl = `${APP_SCHEME}://payment-success?cvId=${cvId}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${APP_SCHEME}://payment-canceled?cvId=${cvId}`;

      // Create Stripe Checkout Session via edge function (direct fetch for reliability)
      const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          email: user.email,
          amount,
          cvId,
          userId: user.id,
          successUrl,
          cancelUrl,
        }),
      });

      const responseText = await response.text();
      if (!response.ok) {
        console.error('Checkout edge function error:', response.status, responseText);
        throw new Error(responseText || `Checkout failed (${response.status})`);
      }

      const data = JSON.parse(responseText);
      if (!data?.url) throw new Error('No checkout URL returned');

      // Open Stripe Checkout in browser
      const result = await WebBrowser.openAuthSessionAsync(data.url, `${APP_SCHEME}://`);

      if (result.type === 'success' && result.url) {
        // Parse the redirect URL
        const redirectUrl = result.url;
        const isSuccess = redirectUrl.includes('payment-success');

        if (isSuccess) {
          // Extract session_id from the URL
          const sessionIdMatch = redirectUrl.match(/session_id=([^&]+)/);
          const sessionId = sessionIdMatch?.[1] || data.sessionId;

          // Update payment status
          await supabase
            .from('payments')
            .update({ status: 'successful' })
            .eq('reference', sessionId);

          analytics.paymentSuccess(amount, cvId, sessionId);

          if (user?.email) {
            sendPaymentConfirmationEmail(user.email, amount, sessionId).catch(() => undefined);
          }

          // Notify admin about the payment (fire-and-forget)
          fetch(`${supabaseUrl}/functions/v1/notify-admin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${supabaseAnonKey}`,
              apikey: supabaseAnonKey,
            },
            body: JSON.stringify({
              type: 'new_payment',
              data: {
                email: user.email,
                amount,
                currency: 'EUR',
                payment_method: 'stripe',
                reference: sessionId,
                service: serviceType === 'cv_tailoring' ? 'CV Tailoring' : 'CV Export',
                status: 'Successful',
              },
            }),
          }).catch(() => undefined);

          // Trigger CV tailoring if job description provided
          let downloadCvId = cvId;
          if (jobDescription && serviceType === 'cv_tailoring') {
            const tailoredCvId = await triggerCVTailoring(cvId, jobDescription);
            if (tailoredCvId) downloadCvId = tailoredCvId;
          }

          // Navigate to success/download screen
          router.replace({
            pathname: serviceType === 'cv_tailoring' ? '/payment-confirmation' : '/download-cv',
            params: { cvId: downloadCvId, amount: String(amount), sessionId: sessionId || '' },
          });
          return;
        }
      }

      // User cancelled or closed the browser
      analytics.paymentFailed(amount, 'User cancelled');
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Failed',
        error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const triggerCVTailoring = async (originalCvId: string, jobDesc: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      let tailoredData: any = null;

      // Use the already-computed tailored result from AsyncStorage (cached by tailor-cv-optimizing)
      const cached = await AsyncStorage.getItem('gr_tailored_cv_result');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.tailored) {
          tailoredData = parsed.tailored;
        }
      }

      // Fallback: call the API if no cached result
      if (!tailoredData) {
        const { data: cv } = await supabase
          .from('cvs')
          .select('cv_data')
          .eq('id', originalCvId)
          .single();

        if (!cv) throw new Error('CV not found');

        const tailorResponse = await fetch(`${supabaseUrl}/functions/v1/tailor-cv`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify({
            cvData: cv.cv_data,
            jobDescription: jobDesc,
          }),
        });

        const tailorText = await tailorResponse.text();
        if (!tailorResponse.ok) {
          throw new Error(tailorText || `CV tailoring failed (${tailorResponse.status})`);
        }

        tailoredData = JSON.parse(tailorText);
      }

      // Create a new CV row with the tailored data (preserves the original)
      const { data: newCv, error: insertError } = await supabase
        .from('cvs')
        .insert({
          user_id: user.id,
          type: 'tailored',
          cv_data: tailoredData,
          payment_status: 'paid',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Failed to insert tailored CV:', insertError);
        return null;
      }

      return newCv?.id || null;
    } catch (error) {
      console.error('CV tailoring error:', error);
      // Don't throw - payment succeeded, tailoring can be retried
      return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Purchase</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Order Summary</Text>
              <Text style={styles.summaryTitle}>Premium CV Export</Text>
              <Text style={styles.summarySubtitle}>Global standard format</Text>
              <View style={styles.priceRow}>
                <View style={styles.pricePill}>
                  <Text style={styles.pricePillText}>€{(amount / 100).toFixed(2)}</Text>
                </View>
                <Text style={styles.priceStrike}>€15.00</Text>
              </View>
            </View>
            <View style={styles.summaryImage} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.methodCard}>
              <View style={[styles.methodIcon, { backgroundColor: colors.surfaceAlt }]}>
                <MaterialIcons name="credit-card" size={20} color={colors.textPrimary} />
              </View>
              <View style={styles.methodContent}>
                <Text style={styles.methodTitle}>Credit / Debit Card</Text>
                <Text style={styles.methodSubtitle}>Visa, Mastercard, Amex, Apple Pay</Text>
              </View>
              <MaterialIcons name="lock" size={16} color={colors.textSecondary} />
            </View>
            <Text style={styles.cardDetailsHint}>
              Tap Pay below to securely enter your card details via Stripe.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerNote}>
            <MaterialIcons name="lock" size={14} color={colors.textSecondary} />
            <Text style={styles.footerNoteText}>
              Encrypted & Secure Payment by Stripe
            </Text>
          </View>
          <PrimaryButton
            label={loading ? 'Processing...' : `Pay €${(amount / 100).toFixed(2)} & ${serviceType === 'cv_tailoring' ? 'Download' : 'Continue'}`}
            icon={loading ? undefined : 'arrow-forward'}
            onPress={handlePayment}
            disabled={loading}
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
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 180,
  },
  summaryCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginBottom: 20,
  },
  summaryText: {
    flex: 1,
    gap: 6,
  },
  summaryLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summaryTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  summarySubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  pricePill: {
    backgroundColor: 'rgba(13,108,242,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pricePillText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  priceStrike: {
    color: 'rgba(148,163,184,0.8)',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  summaryImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: 'rgba(13,108,242,0.2)',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'rgba(13,108,242,0.06)',
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  methodSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  cardDetailsHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerNoteText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
});
