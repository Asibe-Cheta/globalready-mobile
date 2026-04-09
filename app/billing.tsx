import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AppHeader } from '@/components/ui/app-header';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

// Map region codes to [currency, EUR rate] for informational display only.
// Charges are always €9.99 EUR.
const RATES: Record<string, [string, number]> = {
  US: ['USD', 1.08],
  GB: ['GBP', 0.86],
  NG: ['NGN', 1650],
  CA: ['CAD', 1.47],
  AU: ['AUD', 1.66],
  IN: ['INR', 90],
  GH: ['GHS', 16.5],
  KE: ['KES', 140],
  ZA: ['ZAR', 20],
  DE: ['EUR', 1],
  FR: ['EUR', 1],
  IT: ['EUR', 1],
  ES: ['EUR', 1],
  NL: ['EUR', 1],
  BE: ['EUR', 1],
  AT: ['EUR', 1],
  PT: ['EUR', 1],
  IE: ['EUR', 1],
  FI: ['EUR', 1],
  PL: ['PLN', 4.28],
  SE: ['SEK', 11.2],
  NO: ['NOK', 11.8],
  DK: ['DKK', 7.46],
  BR: ['BRL', 5.46],
  MX: ['MXN', 19.8],
  AE: ['AED', 3.97],
};

function getLocalEquivalent(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? 'en-US';
    const parts = locale.split(/[-_]/);
    const region = parts.length >= 2 ? parts[parts.length - 1].toUpperCase() : 'US';
    const [currency, rate] = RATES[region] ?? ['USD', 1.08];
    if (currency === 'EUR') return '';
    const localPrice = (9.99 * rate).toFixed(2);
    return `~${localPrice} ${currency}`;
  } catch {
    return '';
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const PRO_FEATURES = [
  'Unlimited CV downloads',
  'Unlimited AI CV tailoring',
  'Unlimited AI job-fit checks',
  'Full job board access (all listings)',
  'Unlimited interview practice sessions',
  'Cancel anytime',
];

export default function BillingScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const { isPro, subscription, refresh } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const localEquivalent = getLocalEquivalent();

  const handleVisitWebsite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const url = user
        ? `https://globalready.tech/upgrade?uid=${user.id}`
        : 'https://globalready.tech/upgrade';
      Linking.openURL(url);
    } catch {
      Linking.openURL('https://globalready.tech/upgrade');
    }
  };

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/create-subscription-session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          successUrl: 'globalreadymobile://billing-success',
          cancelUrl: 'globalreadymobile://billing',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to start checkout');

      if (Platform.OS === 'android') {
        // On Android, openAuthSessionAsync is unreliable — Chrome Custom Tabs don't
        // intercept custom scheme redirects and the call can throw on some devices.
        // Use Linking.openURL to open the checkout in the default browser instead.
        // SubscriptionContext's AppState listener will refresh subscription when the
        // user returns to the app after payment.
        await Linking.openURL(data.url);
      } else {
        const result = await WebBrowser.openAuthSessionAsync(data.url, 'globalreadymobile://');
        if (result.type === 'success' || result.type === 'dismiss') {
          await refresh();
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      'Your Pro access will continue until the end of the current billing period. Are you sure?',
      [
        { text: 'Keep Pro', style: 'cancel' },
        { text: 'Cancel Subscription', style: 'destructive', onPress: confirmCancel },
      ]
    );
  };

  const confirmCancel = async () => {
    try {
      setCanceling(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${supabaseUrl}/functions/v1/cancel-subscription`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to cancel subscription');

      await refresh();
      Alert.alert('Done', 'Your subscription will cancel at the end of the billing period.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
    } finally {
      setCanceling(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Billing" onBack={router.back} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Current plan card */}
        <View style={styles.planCard}>
          <View style={[styles.planBadge, isPro ? styles.proBadge : styles.freeBadge]}>
            <Text style={[styles.planBadgeText, isPro ? styles.proBadgeText : styles.freeBadgeText]}>
              {isPro ? 'PRO' : 'FREE'}
            </Text>
          </View>
          <Text style={styles.planTitle}>{isPro ? 'GlobalReady Pro' : 'Free Plan'}</Text>
          {isPro && subscription?.current_period_end ? (
            <Text style={styles.planSubtitle}>
              {subscription.cancel_at_period_end
                ? `Cancels on ${formatDate(subscription.current_period_end)}`
                : `Renews on ${formatDate(subscription.current_period_end)}`}
            </Text>
          ) : (
            <Text style={styles.planSubtitle}>
              1 CV · 1 download · 5 job listings · 2 interview sessions
            </Text>
          )}
        </View>

        {/* Upgrade section for free users */}
        {!isPro && (
          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceMain}>€9.99</Text>
              <Text style={styles.pricePer}>/month</Text>
            </View>
            {localEquivalent ? (
              <Text style={styles.priceLocal}>{localEquivalent}</Text>
            ) : null}
            <View style={styles.featureList}>
              {PRO_FEATURES.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Text style={styles.featureCheck}>✓</Text>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            <View style={styles.iosUpgradeWrap}>
              <Text style={styles.iosUpgradeText}>
                To upgrade to Pro, visit our website and subscribe there. Your Pro status will sync automatically to this app.
              </Text>
              <TouchableOpacity
                style={styles.iosUpgradeButton}
                onPress={handleVisitWebsite}
              >
                <Text style={styles.iosUpgradeButtonText}>Visit globalready.tech</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Active Pro features list */}
        {isPro && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pro Features Active</Text>
            {PRO_FEATURES.slice(0, -1).map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Cancel option for active Pro without pending cancellation */}
        {isPro && !subscription?.cancel_at_period_end && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={canceling}
            >
              {canceling ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.cancelNote}>
              You keep Pro access until the end of your billing period.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  planCard: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 20,
  },
  planBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    marginBottom: 12,
  },
  proBadge: {
    backgroundColor: '#0d6cf2',
  },
  freeBadge: {
    backgroundColor: c.border,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  proBadgeText: {
    color: '#fff',
  },
  freeBadgeText: {
    color: c.textSecondary,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 6,
  },
  planSubtitle: {
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
  },
  upgradeCard: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#0d6cf2',
    marginBottom: 20,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  priceMain: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0d6cf2',
  },
  pricePer: {
    fontSize: 16,
    color: c.textSecondary,
    marginLeft: 4,
  },
  priceLocal: {
    fontSize: 13,
    color: c.textSecondary,
    marginBottom: 20,
  },
  featureList: {
    gap: 10,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureCheck: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '700',
  },
  featureText: {
    fontSize: 15,
    color: c.textPrimary,
  },
  section: {
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 4,
  },
  cancelButton: {
    backgroundColor: '#1c0a0a',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  cancelNote: {
    fontSize: 12,
    color: c.textDim,
    textAlign: 'center',
    lineHeight: 18,
  },
  iosUpgradeWrap: {
    backgroundColor: c.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: c.border,
    gap: 12,
  },
  iosUpgradeText: {
    fontSize: 14,
    color: c.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  iosUpgradeButton: {
    backgroundColor: '#0d6cf2',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  iosUpgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
