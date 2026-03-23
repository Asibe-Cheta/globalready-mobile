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
import { supabase } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/services/email/sendgrid';
import { authService } from '@/services/supabase/auth';

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      await authService.signIn(email.trim(), password);
      await AsyncStorage.setItem('gr_has_account', 'true');
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email_confirmed_at) {
        // Send welcome email in background — never block sign-in
        (async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('welcome_sent_at, full_name')
              .eq('id', user.id)
              .single();
            if (!profile?.welcome_sent_at) {
              await sendWelcomeEmail(user.email || email.trim(), profile?.full_name || user.user_metadata?.full_name);
              await supabase.from('profiles').update({ welcome_sent_at: new Date().toISOString() }).eq('id', user.id);
            }
          } catch {
            // Welcome email is non-critical — don't block login
          }
        })();
      }
      router.replace('/landing');
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      setLoading(true);
      const { session } = await authService.signInWithGoogle();
      await AsyncStorage.setItem('gr_has_account', 'true');
      if (session) {
        router.replace('/landing');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setError(null);
    try {
      setLoading(true);
      await authService.signInWithApple();
      await AsyncStorage.setItem('gr_has_account', 'true');
      router.replace('/landing');
    } catch (err: any) {
      if (err?.message?.includes('canceled') || err?.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      setError(err?.message || 'Unable to sign in with Apple.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Sign In" onBack={router.back} compact />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue your GlobalReady journey.</Text>
          </Animated.View>

          <Animated.View style={[styles.form, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {isIOS ? (
              <TouchableOpacity
                style={styles.appleButton}
                onPress={handleAppleLogin}
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
              onPress={handleGoogleLogin}
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

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <PrimaryButton
              label={loading ? 'Signing in...' : 'Sign In'}
              icon={loading ? undefined : 'arrow-forward'}
              onPress={handleLogin}
              disabled={loading}
            />

            <SecondaryButton
              label="Create a new account"
              icon="person-add"
              onPress={() => router.push('/signup')}
              style={styles.secondaryButton}
            />

            <Text style={styles.link} onPress={() => router.push('/reset-password')}>
              Forgot your password?
            </Text>
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
  secondaryButton: {
    marginTop: 4,
  },
  link: {
    textAlign: 'center',
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
