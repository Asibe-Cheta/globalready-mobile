const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Mock native WebRTC packages so Metro doesn't crash in Expo Go.
// EAS Build sets EAS_BUILD=1 — skip mocks so the real packages bundle for TestFlight/production.
// In Expo Go (no EAS_BUILD), mock all three so Metro doesn't error on unlinked native modules.
const isEASBuild = !!process.env.EAS_BUILD;
const NATIVE_ONLY_MODULES = isEASBuild ? [] : [
  '@daily-co/react-native-webrtc',
  '@daily-co/react-native-daily-js',
  '@vapi-ai/react-native',
  'react-native-background-timer',
  'react-native-incall-manager',
];

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (NATIVE_ONLY_MODULES.some((m) => moduleName === m || moduleName.startsWith(m + '/'))) {
    return { type: 'empty' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
