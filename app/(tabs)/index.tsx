import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { theme } from '@/constants/globalready-theme';
import { screenRoutes } from '@/data/screens';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  return (
    <Screen>
      <AppHeader title="GlobalReady Screens" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Tap any screen to preview the React Native conversion.
        </Text>
        <View style={styles.list}>
          {screenRoutes.map((screen) => (
            <Link key={screen.href} href={screen.href} asChild>
              <Link.Trigger>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{screen.title}</Text>
                  <Text style={styles.cardPath}>{screen.href}</Text>
                </View>
              </Link.Trigger>
            </Link>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    subtitle: {
      color: c.textSecondary,
      fontSize: 13,
      marginBottom: theme.spacing.md,
    },
    list: {
      gap: theme.spacing.sm,
    },
    card: {
      padding: theme.spacing.md,
      borderRadius: theme.radii.lg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSoft,
    },
    cardTitle: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
    },
    cardPath: {
      color: c.textSecondary,
      fontSize: 12,
    },
  });
