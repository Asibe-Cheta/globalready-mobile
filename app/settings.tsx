import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/ui/app-header';
import Constants from 'expo-constants';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { useAppTheme } from '@/contexts/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, colors, toggleTheme } = useAppTheme();
  const [notifications, setNotifications] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data including your CVs, assessments, and registration history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete account');
      }

      await supabase.auth.signOut();
      router.replace('/login');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong. Please contact contact@globalready.tech');
    } finally {
      setDeleting(false);
    }
  };

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <AppHeader title="Settings" onBack={router.back} />
      <ScrollView style={s.scrollView}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Preferences</Text>

          <SettingRow
            icon="🔔"
            title="Push Notifications"
            value={notifications}
            onToggle={setNotifications}
            colors={colors}
          />

          <SettingRow
            icon="🌙"
            title="Dark Mode"
            value={isDark}
            onToggle={toggleTheme}
            colors={colors}
          />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>About</Text>

          <TouchableOpacity style={s.settingItem}>
            <Text style={s.settingLabel}>Version</Text>
            <Text style={s.settingValue}>{appVersion}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.settingItem}
            onPress={() => router.push('/privacy-policy')}
          >
            <Text style={s.settingLabel}>Privacy Policy</Text>
            <Text style={s.settingChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.settingItem}
            onPress={() => router.push('/terms-of-service')}
          >
            <Text style={s.settingLabel}>Terms of Service</Text>
            <Text style={s.settingChevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Support</Text>

          <TouchableOpacity
            style={s.settingItem}
            onPress={() => Linking.openURL('mailto:contact@globalready.tech')}
          >
            <Text style={s.settingLabel}>Contact Support</Text>
            <Text style={s.settingChevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={[s.settingItem, s.deleteItem]}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Text style={s.deleteLabel}>Delete Account</Text>
            )}
          </TouchableOpacity>
          <Text style={s.deleteNote}>
            Permanently deletes your account and all data. Cannot be undone.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

import type { AppColors } from '@/contexts/ThemeContext';

const SettingRow = ({
  icon,
  title,
  value,
  onToggle,
  colors,
}: {
  icon: string;
  title: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  colors: AppColors;
}) => {
  const s = makeStyles(colors);
  return (
    <View style={s.settingItem}>
      <View style={s.settingLeft}>
        <Text style={s.settingIcon}>{icon}</Text>
        <Text style={s.settingLabel}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  settingChevron: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  deleteItem: {
    borderColor: '#7f1d1d',
    backgroundColor: '#1c0a0a',
    justifyContent: 'center',
  },
  deleteLabel: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  deleteNote: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 6,
    paddingHorizontal: 4,
    lineHeight: 18,
  },
});
