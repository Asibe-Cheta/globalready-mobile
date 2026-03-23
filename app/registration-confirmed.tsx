import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';

const heroImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAWux8AgKVy4PI3kjmWcyuqyfkXLQlG0ulxss3U48JuRQxOJhJ7YjC6JrM2X7fiN0JYDvsXcRIEhsfMCAodmNGNf58NfgleAC0VkYHCVZ3R1rEOYouemGo0t3zHyLBj4S_ArEkeZTJAxZr6uoopjH8QBW_2UyL8nd3PY1KncG3YXy3VThtnjHvNUvLQ8MIZCd6SKTkhXUy6l114ixNx5MCMf_v3avU-6qThJ3lLJKARmxB4GNvOfZ_4aMjxo2VPDW4hTBYu24r_8C3L';

export default function RegistrationConfirmedScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back-ios" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registration Confirmed</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.successRing}>
            <MaterialIcons name="check-circle" size={56} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>You're Registered!</Text>
          <Text style={styles.heroSubtitle}>
            We've reserved your spot for the upcoming information session.
          </Text>
        </View>

        <View style={styles.cardWrap}>
          <View style={styles.card}>
            <ImageBackground source={{ uri: heroImage }} style={styles.cardImage} imageStyle={styles.cardImageInner}>
              <View style={styles.cardOverlay} />
            </ImageBackground>
            <View style={styles.cardContent}>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>Free Session</Text>
              </View>
              <Text style={styles.cardTitle}>German Language Information Session</Text>
              <View style={styles.cardMetaRow}>
                <MaterialIcons name="calendar-month" size={16} color={colors.textSecondary} />
                <Text style={styles.cardMeta}>Saturday, Oct 26th</Text>
              </View>
              <View style={styles.cardMetaRow}>
                <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
                <Text style={styles.cardMeta}>10:00 AM GMT</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What to Expect</Text>
          <Text style={styles.infoText}>
            A joining link and further instructions will be sent to your registered email address 24 hours
            before the session. Please ensure you have a stable internet connection.
          </Text>
        </View>

        <View style={styles.footer}>
          <PrimaryButton label="Add to Calendar" icon="event" />
          <SecondaryButton label="Back to Hub" onPress={() => router.push('/ai-personalized-guidance')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.background,
  },
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  successRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(13,108,242,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    color: c.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroSubtitle: {
    color: c.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  cardWrap: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  cardImage: {
    height: 160,
    width: '100%',
    justifyContent: 'flex-end',
  },
  cardImageInner: {
    resizeMode: 'cover',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  cardContent: {
    padding: 16,
    gap: 8,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: c.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cardBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardMeta: {
    color: c.textSecondary,
    fontSize: 13,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  infoTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoText: {
    color: c.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
});
