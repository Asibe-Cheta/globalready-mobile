import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Linking, Platform, View } from 'react-native';

import { GlobalBottomNav } from '@/components/GlobalBottomNav';
import { AssessmentProvider } from '@/contexts/AssessmentContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { AppThemeProvider, darkColors, lightColors, useAppTheme } from '@/contexts/ThemeContext';
import { savePushToken } from '@/services/supabase/push-tokens';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: '24bee49b-8cb4-4a4e-acf8-166ae28576d3',
  });
  return tokenData.data;
}

function AppContent() {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, colors } = useAppTheme();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    const ignoredRoutes = new Set([
      '/',
      '/index',
      '/login',
      '/signup',
      '/reset-password',
      '/update-password',
      '/profile',
      '/landing',
    ]);

    if (!pathname || ignoredRoutes.has(pathname)) {
      return;
    }

    AsyncStorage.setItem('gr_last_route', pathname).catch(() => undefined);
  }, [pathname]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      Linking.getInitialURL().then(url => {
        if (!url || url === 'globalreadymobile:///' || url === 'globalreadymobile://') {
          router.replace('/');
        }
      });
    }
  }, []);

  useEffect(() => {
    registerForPushNotifications()
      .then(token => { if (token) savePushToken(token).catch(() => {}); })
      .catch(() => {});

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response.notification.request.content.data?.screen;
      if (screen === 'daily-matches') {
        router.push('/daily-matches');
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.background,
          border: colors.border,
          primary: colors.primary,
          text: colors.textPrimary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.background,
          border: colors.border,
          primary: colors.primary,
          text: colors.textPrimary,
        },
      };

  return (
    <ThemeProvider value={navTheme}>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="landing" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </View>
        <GlobalBottomNav />
      </View>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <SubscriptionProvider>
        <AssessmentProvider>
          <AppContent />
        </AssessmentProvider>
      </SubscriptionProvider>
    </AppThemeProvider>
  );
}
