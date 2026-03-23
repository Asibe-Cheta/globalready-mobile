import { Redirect } from 'expo-router';

/**
 * Fallback for Expo Router when a deep-link / pathname doesn't match any route.
 * Helps avoid the "Unmatched Route" screen (notably on Android deep-links).
 */
export default function NotFound() {
  return <Redirect href="/landing" />;
}

