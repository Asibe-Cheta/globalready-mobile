import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { AppHeader } from '@/components/ui/app-header';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { theme } from '@/constants/globalready-theme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/lib/supabase';
import { buildCVHtml, type CVData } from '@/utils/cvHtml';

export default function ViewCvScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const { cvId } = useLocalSearchParams<{ cvId: string }>();
  const { isPro } = useSubscription();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCV = useCallback(async () => {
    if (!cvId) {
      setError('Missing CV');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError('Sign in to view your CVs');
        setLoading(false);
        return;
      }

      const { data: row, error: fetchError } = await supabase
        .from('cvs')
        .select('id, cv_data, payment_status')
        .eq('id', cvId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !row) {
        setError('CV not found');
        setLoading(false);
        return;
      }

      const status = (row.payment_status ?? '').toLowerCase();
      if (!isPro && status !== 'paid' && status !== 'completed') {
        setError('This CV is not available for viewing yet. Complete payment first.');
        setLoading(false);
        return;
      }

      const cvData = row.cv_data as CVData | null;
      if (!cvData) {
        setError('CV data not found');
        setLoading(false);
        return;
      }

      setHtml(buildCVHtml(cvData));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load CV');
    } finally {
      setLoading(false);
    }
  }, [cvId, isPro]);

  useEffect(() => {
    loadCV();
  }, [loadCV]);

  const handleDownload = () => {
    router.push({
      pathname: '/download-cv',
      params: { cvId: cvId ?? '' },
    });
  };

  if (loading) {
    return (
      <Screen>
        <AppHeader title="View CV" onBack={router.back} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading CV...</Text>
        </View>
      </Screen>
    );
  }

  if (error || !html) {
    return (
      <Screen>
        <AppHeader title="View CV" onBack={router.back} />
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error ?? 'Could not load CV'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCV}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="View CV" onBack={router.back} />
      <View style={styles.webViewWrap}>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.webView}
          scrollEnabled
          showsVerticalScrollIndicator
        />
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Download as PDF" icon="download" onPress={handleDownload} />
      </View>
    </Screen>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: c.textSecondary,
    },
    errorText: {
      marginTop: 12,
      fontSize: 16,
      color: c.textPrimary,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 16,
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: c.primary,
      borderRadius: 8,
    },
    retryText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textPrimary,
    },
    webViewWrap: {
      flex: 1,
      backgroundColor: c.surface,
    },
    webView: {
      flex: 1,
      backgroundColor: c.surface,
    },
    footer: {
      padding: 16,
      paddingBottom: 24,
      backgroundColor: c.background,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
  });
