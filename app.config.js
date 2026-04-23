/**
 * Expo config with sanitized values so native iOS never gets nil when
 * building NSDictionary from the manifest (avoids "attempt to insert nil object" crash).
 * Deep-sanitizes the entire config so no null/undefined reaches JSON → native.
 */
const base = require('./app.json');

function str(v) {
  if (v == null || v === '') return '';
  return String(v);
}

/** Recursively replace null/undefined with '' so embedded JSON has no null → native gets no nil. */
function sanitizeForNative(obj) {
  if (obj === null || obj === undefined) {
    return '';
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForNative(item));
  }
  if (typeof obj === 'object') {
    const out = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val === null || val === undefined) {
        out[key] = '';
      } else if (typeof val === 'object') {
        out[key] = sanitizeForNative(val);
      } else {
        out[key] = val;
      }
    }
    return out;
  }
  return obj;
}

const expo = {
  ...base.expo,
  updates: {
    url: 'https://u.expo.dev/24bee49b-8cb4-4a4e-acf8-166ae28576d3',
  },
  // Ensure every value in extra is a non-nil string so native never crashes
  extra: {
    eas: {
      projectId: str(
        process.env.EAS_PROJECT_ID ??
          base.expo?.extra?.eas?.projectId ??
          '24bee49b-8cb4-4a4e-acf8-166ae28576d3'
      ),
    },
    stripePublishableKey: str(
      process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
        base.expo?.extra?.stripePublishableKey ??
        process.env.STRIPE_PUBLISHABLE_KEY ??
        ''
    ),
    supabaseUrl: str(
      process.env.EXPO_PUBLIC_SUPABASE_URL ??
        base.expo?.extra?.supabaseUrl ??
        process.env.SUPABASE_URL ??
        ''
    ),
    supabaseAnonKey: str(
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
        base.expo?.extra?.supabaseAnonKey ??
        process.env.SUPABASE_ANON_KEY ??
        ''
    ),
    confirmRedirectUrl: str(
      process.env.EXPO_PUBLIC_CONFIRM_REDIRECT_URL ??
        base.expo?.extra?.confirmRedirectUrl ??
        ''
    ),
  },
  ios: {
    ...base.expo?.ios,
    runtimeVersion: base.expo?.version ?? '2.2.1',
    buildNumber: str(base.expo?.ios?.buildNumber ?? '8'),
    infoPlist: {
      ...base.expo?.ios?.infoPlist,
      // So Stripe native can read key from plist if needed (avoids nil at init).
      StripePublishableKey: str(
        process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
          process.env.STRIPE_PUBLISHABLE_KEY ??
          base.expo?.extra?.stripePublishableKey ??
          ''
      ),
    },
  },
};

// Inject android runtimeVersion and expo-updates plugin
expo.android = {
  ...expo.android,
  runtimeVersion: { policy: 'appVersion' },
};

// Add expo-updates plugin if not already present
const hasUpdatesPlugin = (expo.plugins ?? []).some(
  (p) => p === 'expo-updates' || (Array.isArray(p) && p[0] === 'expo-updates')
);
if (!hasUpdatesPlugin) {
  expo.plugins = [...(expo.plugins ?? []), 'expo-updates'];
}

// Deep-sanitize so no null/undefined remains anywhere (plugins, experiments, etc.)
module.exports = {
  expo: sanitizeForNative(expo),
};
