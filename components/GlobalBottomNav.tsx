import { MaterialIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/contexts/ThemeContext';

const HIDDEN_ROUTES = new Set([
  '/',
  '/index',
  '/login',
  '/signup',
  '/reset-password',
  '/update-password',
  '/confirm-email',
  '/registration-confirmed',
]);

const tabs = [
  { key: 'home', label: 'Home', icon: 'home', route: '/landing', match: ['/landing'] },
  {
    key: 'jobs',
    label: 'Jobs',
    icon: 'work',
    route: '/jobs-feed',
    match: ['/jobs-feed', '/job-detail', '/job-fit-analysis', '/confirm-job-cv', '/job-match', '/job-search'],
  },
  {
    key: 'saved',
    label: 'Saved',
    icon: 'bookmark',
    route: '/saved-jobs',
    match: ['/saved-jobs', '/my-cvs', '/my-courses'],
  },
  {
    key: 'practice',
    label: 'Practice',
    icon: 'mic',
    route: '/interview-practice',
    match: ['/interview-practice', '/interview-prep', '/interview-session', '/interview-feedback'],
  },
  { key: 'profile', label: 'Profile', icon: 'person', route: '/profile', match: ['/profile', '/settings'] },
];

export function GlobalBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  if (HIDDEN_ROUTES.has(pathname)) return null;

  return (
    <View style={[
      styles.tab_wrap,
      {
        backgroundColor: colors.navBg,
        borderTopColor: colors.navBorder,
        paddingBottom: Math.max(insets.bottom, 6),
      }
    ]}>
      {tabs.map((tab) => {
        const isActive = tab.match.some((m) => pathname === m || pathname.startsWith(m));
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => {
              if (!isActive) router.replace(tab.route as any);
            }}
            accessibilityRole="button"
          >
            <MaterialIcons
              name={tab.icon as any}
              size={22}
              color={isActive ? colors.primary : colors.navInactive}
            />
            <Text style={[styles.label, { color: colors.navInactive }, isActive && { color: colors.primary, fontWeight: '700' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tab_wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    flex: 1,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
});
