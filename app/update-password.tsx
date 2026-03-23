import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { theme } from '@/constants/globalready-theme';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services/supabase/auth';

export default function UpdatePasswordScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  const accessToken = useMemo(() => {
    const token = params.access_token || params.accessToken;
    return typeof token === 'string' ? token : undefined;
  }, [params.access_token, params.accessToken]);

  const refreshToken = useMemo(() => {
    const token = params.refresh_token || params.refreshToken;
    return typeof token === 'string' ? token : undefined;
  }, [params.refresh_token, params.refreshToken]);

  useEffect(() => {
    const setSessionFromLink = async () => {
      if (!accessToken || !refreshToken) return;
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    };

    setSessionFromLink().catch(() => undefined);
  }, [accessToken, refreshToken]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleUpdate = async () => {
    setError(null);
    setMessage(null);

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await authService.updatePassword(password);
      setMessage('Password updated. You can sign in now.');
      router.replace('/login');
    } catch (err: any) {
      setError(err?.message || 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Create New Password" onBack={router.back} compact />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.title}>Set a new password</Text>
            <Text style={styles.subtitle}>Choose a strong password to secure your account.</Text>
          </Animated.View>

          <Animated.View
            style={[styles.form, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            <View style={styles.field}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.inputPlaceholder}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.inputPlaceholder}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {message ? <Text style={styles.successText}>{message}</Text> : null}

            <PrimaryButton
              label={loading ? 'Updating...' : 'Update Password'}
              icon={loading ? undefined : 'lock'}
              onPress={handleUpdate}
              disabled={loading}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xl,
  },
  hero: {
    marginTop: theme.spacing.xs,
    gap: 8,
  },
  title: {
    color: c.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    marginTop: theme.spacing.md,
    gap: 14,
  },
  field: {
    gap: 8,
  },
  label: {
    color: 'rgba(226,232,240,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    backgroundColor: c.surface,
    color: c.textPrimary,
    paddingHorizontal: 14,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
  },
  successText: {
    color: theme.colors.success,
    fontSize: 12,
  },
});
