import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    TouchableOpacity,
    View,
} from 'react-native';

const isIOS = Platform.OS === 'ios';

import { AppHeader } from '@/components/ui/app-header';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { theme } from '@/constants/globalready-theme';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { authService } from '@/services/supabase/auth';

export default function SignupScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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

  const handleSignup = async () => {
    setError(null);
    setSuccess(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await authService.signUp(email.trim(), password, fullName.trim());
      await AsyncStorage.setItem('gr_has_account', 'true');
      setSuccess('Check your inbox to verify your email, then sign in.');
    } catch (err: any) {
      const message = err?.message || 'Unable to create account. Try again.';
      if (/already been registered/i.test(message) || /already registered/i.test(message)) {
        setError('This email is already registered. Tap "Resend confirmation email".');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      const { session } = await authService.signInWithGoogle();
      await AsyncStorage.setItem('gr_has_account', 'true');
      if (session) {
        router.replace('/landing');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to continue with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignup = async () => {
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      await authService.signInWithApple();
      await AsyncStorage.setItem('gr_has_account', 'true');
      router.replace('/landing');
    } catch (err: any) {
      if (err?.message?.includes('canceled') || err?.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      setError(err?.message || 'Unable to continue with Apple.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Enter your email to resend confirmation.');
      return;
    }
    try {
      setError(null);
      setResending(true);
      await authService.resendConfirmation(email.trim(), fullName.trim());
      setSuccess('Confirmation email resent. Check your inbox.');
    } catch (err: any) {
      setError(err?.message || 'Unable to resend confirmation email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Create Account" onBack={router.back} compact />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.title}>Get started</Text>
            <Text style={styles.subtitle}>Create your GlobalReady account in minutes.</Text>
          </Animated.View>

          <Animated.View style={[styles.form, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {isIOS ? (
              <TouchableOpacity
                style={styles.appleButton}
                onPress={handleAppleSignup}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Sign in with Apple"
              >
                <AntDesign name="apple" size={20} color="#fff" />
                <Text style={styles.appleButtonText}>Sign in with Apple</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignup}
              disabled={loading}
              accessibilityRole="button"
            >
              <AntDesign name="google" size={18} color={colors.textPrimary} />
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Jane Doe"
                placeholderTextColor={colors.inputPlaceholder}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
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
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
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
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            <PrimaryButton
              label={loading ? 'Creating account...' : 'Create Account'}
              icon={loading ? undefined : 'arrow-forward'}
              onPress={handleSignup}
              disabled={loading}
            />

            <TouchableOpacity
              style={styles.resendLink}
              onPress={handleResend}
              accessibilityRole="button"
              disabled={resending}
            >
              <Text style={styles.resendText}>
                {resending ? 'Resending...' : 'Resend confirmation email'}
              </Text>
            </TouchableOpacity>

            <SecondaryButton
              label="Already have an account? Sign in"
              icon="login"
              onPress={() => router.replace('/login')}
              style={styles.secondaryButton}
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
    fontSize: 28,
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
  appleButton: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  appleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  googleButton: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  googleText: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.3)',
  },
  dividerText: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
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
  secondaryButton: {
    marginTop: 4,
  },
  resendLink: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  resendText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
