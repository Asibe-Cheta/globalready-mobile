import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

// Get the app scheme from config or use default
const APP_SCHEME = Constants.expoConfig?.scheme || 'globalreadymobile';

const createRedirectUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  // In Expo Go, use the Expo-specific URL format
  if (Constants.appOwnership === 'expo') {
    if (Constants.linkingUri) {
      const base = Constants.linkingUri.endsWith('/')
        ? Constants.linkingUri
        : `${Constants.linkingUri}/`;
      return `${base}--/${normalizedPath}`;
    }
    if (Constants.expoConfig?.hostUri) {
      return `exp://${Constants.expoConfig.hostUri}/--/${normalizedPath}`;
    }
    return Linking.createURL(`/${normalizedPath}`, { scheme: 'exp' });
  }

  // In standalone/production builds, explicitly use the app scheme
  // This ensures the deep link works correctly for OAuth redirects
  return `${APP_SCHEME}://${normalizedPath}`;
};

WebBrowser.maybeCompleteAuthSession();

const parseAuthParams = (url: string) => {
  const [base, hash] = url.split('#');
  const queryString = base.includes('?') ? base.split('?')[1] : '';
  const params = new URLSearchParams(queryString);

  if (hash) {
    const hashParams = new URLSearchParams(hash);
    hashParams.forEach((value, key) => {
      if (!params.has(key)) {
        params.set(key, value);
      }
    });
  }

  return params;
};

/** Send a welcome email to the user via SendGrid (fire-and-forget) */
const sendWelcomeEmail = (email: string, fullName: string) => {
  const welcomeTemplateId =
    process.env.EXPO_PUBLIC_SENDGRID_TEMPLATE_WELCOME || '';

  fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify(
      welcomeTemplateId
        ? {
            to: email,
            templateId: welcomeTemplateId,
            dynamicTemplateData: {
              name: fullName || 'there',
              app_url: 'https://globalready.tech',
            },
          }
        : {
            to: email,
            subject: 'Welcome to GlobalReady!',
            html: `
              <!doctype html>
              <html>
                <body style="margin:0;background:#f8fafc;padding:24px;font-family:Arial,sans-serif;color:#1e293b;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;">
                    <tr>
                      <td style="padding:32px 24px 12px;">
                        <div style="font-size:11px;letter-spacing:2px;color:#0d6cf2;text-transform:uppercase;font-weight:700;">GlobalReady</div>
                        <h2 style="margin:16px 0 8px;font-size:22px;color:#0f172a;">Welcome, ${fullName || 'there'}!</h2>
                        <p style="color:#475569;font-size:14px;line-height:1.6;">
                          Your GlobalReady account is all set. You now have access to:
                        </p>
                        <ul style="color:#475569;font-size:14px;line-height:1.8;padding-left:20px;">
                          <li>AI-powered CV tailoring for any job</li>
                          <li>Job match analysis and skill gap reports</li>
                          <li>High-income career skill courses</li>
                          <li>Personalized career guidance</li>
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 24px 24px;">
                        <a href="https://globalready.tech" style="display:inline-block;background:#0d6cf2;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:999px;font-weight:700;font-size:14px;">
                          Open GlobalReady
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 24px 20px;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;">
                        Questions? Reply to this email or visit our support page.
                      </td>
                    </tr>
                  </table>
                </body>
              </html>
            `,
          }
    ),
  }).catch(() => undefined);
};

/** Notify admin about a new user signup (fire-and-forget) */
const notifyAdminNewUser = (email: string, fullName: string) => {
  fetch(`${supabaseUrl}/functions/v1/notify-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({
      type: 'new_user',
      data: { email, full_name: fullName },
    }),
  }).catch(() => undefined);
};

export const authService = {
  signUp: async (email: string, password: string, fullName: string) => {
    console.log('[Auth] signUp via custom-signup edge function');

    // Use our custom-signup edge function which sends confirmation via SendGrid
    const response = await fetch(`${supabaseUrl}/functions/v1/custom-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
        fullName: fullName?.trim() || '',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Auth] signUp error:', result.error);
      throw new Error(result.error || 'Unable to create account');
    }

    // Notify admin about new user signup (fire-and-forget)
    notifyAdminNewUser(email, fullName?.trim() || '');

    return result;
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  signInWithGoogle: async () => {
    const redirectTo = createRedirectUrl('landing');
    console.log('[Auth] signInWithGoogle redirectTo:', redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error('[Auth] signInWithGoogle OAuth error:', error.message);
      throw error;
    }

    if (!data?.url) {
      throw new Error('Unable to start Google sign-in.');
    }

    console.log('[Auth] Opening auth session with URL:', data.url);
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) {
      return { session: null, user: null };
    }

    const params = parseAuthParams(result.url);
    const code = params.get('code');

    let sessionData;

    if (code) {
      const { data: sd, error: sessionError } = await supabase.auth.exchangeCodeForSession(
        result.url
      );
      if (sessionError) throw sessionError;
      sessionData = sd;
    } else {
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { data: sd, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
        sessionData = sd;
      } else {
        throw new Error('Authentication did not return a session.');
      }
    }

    // Check if user is new (created within the last 60 seconds) → send welcome email
    if (sessionData?.user) {
      const createdAt = new Date(sessionData.user.created_at).getTime();
      const now = Date.now();
      const isNewUser = now - createdAt < 60_000; // within 60 seconds

      if (isNewUser) {
        const fullName =
          sessionData.user.user_metadata?.full_name ||
          sessionData.user.user_metadata?.name ||
          '';
        const userEmail = sessionData.user.email || '';

        console.log('[Auth] New Google user detected, sending welcome email');
        sendWelcomeEmail(userEmail, fullName);
        notifyAdminNewUser(userEmail, fullName);
      }
    }

    return sessionData;
  },

  /**
   * Sign in with Apple (iOS only). Meets App Store Guideline 4.8 when offered alongside Google/email.
   */
  signInWithApple: async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Sign in with Apple is only available on iOS.');
    }

    const Apple = await import('expo-apple-authentication');
    if (!Apple?.signInAsync || typeof Apple.signInAsync !== 'function') {
      throw new Error(
        'Sign in with Apple is not available in this build. Use the App Store or development build, or sign in with Google or email.'
      );
    }

    const credential = await Apple.signInAsync({
      requestedScopes: [
        Apple.AppleAuthenticationScope?.FULL_NAME ?? 0,
        Apple.AppleAuthenticationScope?.EMAIL ?? 1,
      ],
    });

    const { identityToken } = credential;
    if (!identityToken) {
      throw new Error('Apple Sign In did not return an identity token.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: identityToken,
    });

    if (error) throw error;

    // On first sign-in, Apple may provide fullName; update profile if we have it
    const fullName = credential.fullName;
    const nameParts = fullName
      ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ')
      : '';
    if (nameParts && data?.user) {
      await supabase.auth.updateUser({
        data: {
          ...data.user.user_metadata,
          full_name: nameParts,
        },
      });
      const userEmail = data.user.email || '';
      sendWelcomeEmail(userEmail, nameParts);
      notifyAdminNewUser(userEmail, nameParts);
    } else if (data?.user) {
      const createdAt = new Date(data.user.created_at).getTime();
      const now = Date.now();
      const isNewUser = now - createdAt < 60_000;
      if (isNewUser) {
        const name =
          data.user.user_metadata?.full_name || nameParts || '';
        const userEmail = data.user.email || '';
        if (userEmail) {
          sendWelcomeEmail(userEmail, name);
          notifyAdminNewUser(userEmail, name);
        }
      }
    }

    return data;
  },

  requestPasswordReset: async (email: string) => {
    const redirectTo = createRedirectUrl('update-password');
    console.log('[Auth] requestPasswordReset redirectTo:', redirectTo);

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error('[Auth] requestPasswordReset error:', error.message);
      throw error;
    }
    return data;
  },

  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  resendConfirmation: async (email: string, fullName?: string) => {
    console.log('[Auth] resendConfirmation via custom-resend-confirmation edge function');

    // Use our custom-resend-confirmation edge function which sends via SendGrid
    const response = await fetch(
      `${supabaseUrl}/functions/v1/custom-resend-confirmation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName?.trim() || '',
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('[Auth] resendConfirmation error:', result.error);
      throw new Error(result.error || 'Unable to resend confirmation email');
    }

    return result;
  },

  getCurrentUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },
};
