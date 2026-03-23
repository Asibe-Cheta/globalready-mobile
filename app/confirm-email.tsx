import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { theme } from '@/constants/globalready-theme';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

export default function ConfirmEmailScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; type?: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    const verify = async () => {
      const token = params.token;
      const type = params.type === 'magiclink' ? 'magiclink' : 'signup';

      if (!token) {
        setStatus('error');
        setMessage('Missing confirmation token.');
        return;
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type,
        });

        if (error) {
          throw error;
        }

        if (data?.session) {
          setStatus('success');
          setMessage('Email confirmed. Redirecting...');
          router.replace('/landing');
        } else {
          setStatus('success');
          setMessage('Email confirmed. Please sign in.');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.message || 'Unable to confirm email.');
      }
    };

    verify();
  }, [params.token, params.type, router]);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Confirming your email</Text>
        <Text style={styles.message}>{message}</Text>
        {status === 'error' ? (
          <PrimaryButton label="Back to Sign In" onPress={() => router.replace('/login')} />
        ) : null}
      </View>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    gap: 12,
  },
  title: {
    color: c.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  message: {
    color: c.textSecondary,
    fontSize: 14,
  },
});
