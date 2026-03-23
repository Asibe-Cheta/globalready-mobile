import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
export default function RegisterInfoSessionScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [consent, setConsent] = useState(false);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back-ios" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Register for Info Session</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/landing')}
            accessibilityRole="button"
          >
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sessionCard}>
            <View style={styles.sessionRow}>
              <MaterialIcons name="calendar-month" size={18} color={colors.primary} />
              <Text style={styles.sessionTitle}>Saturday, Oct 26th</Text>
            </View>
            <Text style={styles.sessionMeta}>10:00 AM GMT • Online Session</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              placeholderTextColor={colors.inputPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Phone/WhatsApp (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="+1 234 567 890"
              placeholderTextColor={colors.inputPlaceholder}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Current Location</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Enter your country"
                placeholderTextColor={colors.inputPlaceholder}
              />
              <MaterialIcons name="public" size={18} color={colors.textSecondary} style={styles.inputIcon} />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Level of Interest</Text>
            <View style={styles.selectInput}>
              <Text style={styles.selectPlaceholder}>Select your current level</Text>
              <MaterialIcons name="expand-more" size={20} color={colors.textSecondary} />
            </View>
          </View>

          <Pressable style={styles.checkboxRow} onPress={() => setConsent(!consent)}>
            <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
              {consent && <MaterialIcons name="check" size={14} color="#fff" />}
            </View>
            <Text style={styles.checkboxText}>
              I agree to receive event reminders and program updates via email and WhatsApp.
            </Text>
          </Pressable>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <PrimaryButton label="Confirm My Seat" icon="arrow-forward" />
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
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: c.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 160,
  },
  sessionCard: {
    backgroundColor: 'rgba(13,108,242,0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(13,108,242,0.3)',
    padding: 16,
    marginBottom: 18,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sessionTitle: {
    color: c.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  sessionMeta: {
    color: c.textSecondary,
    fontSize: 12,
    marginLeft: 26,
  },
  formSection: {
    marginBottom: 14,
  },
  label: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    color: c.textPrimary,
    paddingHorizontal: 14,
  },
  selectInput: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectPlaceholder: {
    color: c.textSecondary,
    fontSize: 13,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  checkboxText: {
    flex: 1,
    color: c.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  bottomSpacer: {
    height: 40,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: c.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
