import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Safely read from expo-constants as fallback (app.json has hardcoded values).
// Wrapped in try/catch to avoid any potential nil crashes from the native module.
function getExpoConfigExtra(): { supabaseUrl?: string; supabaseAnonKey?: string } {
  try {
    // Dynamic require to avoid top-level import that could crash before we catch it
    const Constants = require('expo-constants').default;
    return Constants?.expoConfig?.extra || {};
  } catch {
    return {};
  }
}

// EXPO_PUBLIC_* are inlined at EAS build time. Fall back to app.json extra values.
const extra = getExpoConfigExtra();

export const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  extra.supabaseUrl ||
  '';

export const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  extra.supabaseAnonKey ||
  '';

// Warn instead of throw to avoid crashing the app on startup.
// The app will fail gracefully when Supabase calls are made.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY. ' +
    'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in Expo env, .env, or app.json extra.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
