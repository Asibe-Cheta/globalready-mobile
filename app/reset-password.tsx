import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { authService } from '@/services/supabase/auth';

export default function ResetPasswordScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

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

  const handleReset = async () => {
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      await authService.requestPasswordReset(email.trim());
      setMessage('Check your email for a password reset link.');
    } catch (err: any) {
      setError(err?.message || 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Reset Password" onBack={router.back} compact />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.title}>Forgot your password?</Text>
            <Text style={styles.subtitle}>We'll email you a link to create a new one.</Text>
          </Animated.View>

          <Animated.View
            style={[styles.form, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="you@email.com"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {message ? <Text style={styles.successText}>{message}</Text> : null}

            <PrimaryButton
              label={loading ? 'Sending link...' : 'Send Reset Link'}
              icon={loading ? undefined : 'mail'}
              onPress={handleReset}
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
