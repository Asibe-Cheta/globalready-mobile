import { MaterialIcons } from '@expo/vector-icons';
import { LoadingState } from '@/components/LoadingState';
import { AppHeader } from '@/components/ui/app-header';
import { PrimaryButton } from '@/components/ui/primary-button';
import { screenRoutes } from '@/data/screens';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface Stats {
  cvCount: number;
  savedJobs: number;
  coursesRegistered: number;
}

// Extracts the storage path from a full Supabase URL and returns a fresh signed URL.
// Works whether the avatars bucket is public or private.
const getSignedAvatarUrl = async (avatarUrl: string): Promise<string | null> => {
  try {
    const match = avatarUrl.match(/\/avatars\/(.+?)(?:\?|$)/);
    const storagePath = match ? match[1] : avatarUrl;
    const { data } = await supabase.storage
      .from('avatars')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { isPro } = useSubscription();
  const [avatarLoadError, setAvatarLoadError] = useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    cvCount: 0,
    savedJobs: 0,
    coursesRegistered: 0,
  });
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lastRoute, setLastRoute] = useState<string | null>(null);
  const [lastRouteLabel, setLastRouteLabel] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    country: '',
    linkedin: '',
    portfolio: '',
  });

  useEffect(() => {
    loadProfile();
    loadStats();
    loadLastRoute();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(tabs)');
        return;
      }

      // Try to get profile, fallback to auth user data
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
      } else {
        // Fallback to auth user data
        setProfile({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url,
        });
      }
    } catch (error) {
      // If profiles table doesn't exist, use auth user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setProfile({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url,
        });
      }
    }
  };

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      full_name: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      country: profile.country || '',
      linkedin: profile.linkedin || '',
      portfolio: profile.portfolio || '',
    });
    if (profile.avatar_url) {
      // Extract storage path from the stored URL and generate a signed URL
      getSignedAvatarUrl(profile.avatar_url).then((signed) => {
        if (signed) setAvatarPreviewUrl(signed);
      });
    }
  }, [profile]);

  const loadStats = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Count paid CVs (matches what My CVs screen shows)
      const { count: cvCount } = await supabase
        .from('cvs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('payment_status', ['paid', 'completed']);

      // Count saved jobs
      const { count: savedJobs } = await supabase
        .from('saved_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Count course registrations
      const { count: coursesRegistered } = await supabase
        .from('course_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        cvCount: cvCount || 0,
        savedJobs: savedJobs || 0,
        coursesRegistered: coursesRegistered || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLastRoute = async () => {
    const route = await AsyncStorage.getItem('gr_last_route');
    if (route) {
      setLastRoute(route);
      const match = screenRoutes.find((screen) => screen.href === route);
      setLastRouteLabel(match?.title || 'Continue where you left off');
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data including your CVs, assessments, and registration history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete My Account', style: 'destructive', onPress: confirmDeleteAccount },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
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

  const handleAvatarPress = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Enable photo access to upload an avatar.');
        return;
      }

      const mediaTypes = (ImagePicker as any).MediaType?.Images
        ? [(ImagePicker as any).MediaType.Images]
        : ['images'];
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const uri = asset.uri;

      // Show the picked image immediately — no network needed
      setAvatarPreviewUrl(uri);
      setUploadingAvatar(true);
      const fallbackExtFromMime = (mime?: string) => {
        if (!mime) return 'jpg';
        if (mime.includes('png')) return 'png';
        if (mime.includes('heic')) return 'heic';
        if (mime.includes('heif')) return 'heif';
        return 'jpg';
      };

      const assetName = asset.fileName || '';
      const assetExt = assetName.includes('.') ? assetName.split('.').pop() : undefined;
      const fileExt = (assetExt || uri.split('.').pop() || fallbackExtFromMime(asset.mimeType))
        .toString()
        .toLowerCase();
      const normalizedExt = fileExt === 'jpg' ? 'jpeg' : fileExt;
      const contentType = asset.mimeType || `image/${normalizedExt}`;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Sign in required', 'Please sign in to update your profile photo.');
        return;
      }

      const response = await fetch(uri);
      const blob = await response.blob();
      const path = `${user.id}/avatar.${fileExt || 'jpg'}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType, upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Use signed URL so it works whether the bucket is public or private
      const { data: signedData, error: signedError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, 60 * 60 * 24 * 7); // 7-day signed URL for display

      if (signedError || !signedData?.signedUrl) {
        throw new Error('Unable to generate avatar URL.');
      }

      // Store the public URL format in DB (stable path reference, doesn't expire)
      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = publicData?.publicUrl || path;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          email: user.email,
          full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
        });

      if (profileError) {
        if (profileError.code === 'PGRST204') {
          Alert.alert(
            'Profile update failed',
            'The avatar_url column is missing. Run PROFILES_TABLE_UPDATE.sql in Supabase.'
          );
          return;
        }
        Alert.alert(
          'Profile update failed',
          profileError.message || 'Unable to update profile photo.'
        );
        return;
      }

      setProfile((prev: any) => ({ ...(prev || {}), avatar_url: publicUrl }));
      setAvatarPreviewUrl(signedData.signedUrl);
      Alert.alert('Profile updated', 'Your profile photo has been updated.');
    } catch (error: any) {
      Alert.alert('Upload failed', error?.message || 'Unable to update profile photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      setSavingProfile(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        Alert.alert('Sign in required', 'Please sign in to update your profile.');
        return;
      }

      const payload = {
        id: user.id,
        full_name: profileForm.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
        email: profileForm.email || user.email,
        phone: profileForm.phone || null,
        country: profileForm.country || null,
        linkedin: profileForm.linkedin || null,
        portfolio: profileForm.portfolio || null,
      };

      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) throw error;

      setProfile((prev: any) => ({
        ...(prev || {}),
        ...payload,
      }));
      Alert.alert('Profile updated', 'Your profile details were saved.');
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Unable to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleBack = () => {
    const canGoBack = (router as any).canGoBack?.();
    if (canGoBack) {
      router.back();
      return;
    }
    router.replace('/landing');
  };

  if (loading) {
    return <LoadingState message="Loading profile..." />;
  }

  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.headerWrapper}>
          <AppHeader title="Profile" onBack={handleBack} containerStyle={styles.headerOffset} compact />
        </View>
      </SafeAreaView>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleAvatarPress} accessibilityRole="button">
            {avatarPreviewUrl ? (
              <ExpoImage
                source={{ uri: avatarPreviewUrl || profile?.avatar_url }}
                style={styles.avatarImage}
                cachePolicy="none"
                contentFit="cover"
                onError={(error) => {
                  setAvatarLoadError(
                    (error as any)?.message || (error as any)?.error?.message || 'image load failed'
                  );
                }}
                onLoad={() => setAvatarLoadError(null)}
              />
            ) : (
              <Text style={styles.avatarText}>
                {profile?.full_name?.[0]?.toUpperCase() || '?'}
              </Text>
            )}
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>{uploadingAvatar ? '...' : 'Edit'}</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        {lastRoute ? (
          <View style={styles.continueCard}>
            <View style={styles.continueTextWrap}>
              <Text style={styles.continueTitle}>Continue where you left off</Text>
              <Text style={styles.continueSubtitle}>{lastRouteLabel}</Text>
            </View>
            <PrimaryButton
              label="Resume"
              icon="arrow-forward"
              onPress={() => router.push(lastRoute)}
              style={styles.continueButton}
            />
          </View>
        ) : null}

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="description" size={18} color="#0d6cf2" style={{ marginBottom: 6 }} />
            <Text style={styles.statNumber}>{stats.cvCount}</Text>
            <Text style={styles.statLabel}>CVs</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="favorite" size={18} color="#ef4444" style={{ marginBottom: 6 }} />
            <Text style={styles.statNumber}>{stats.savedJobs}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="school" size={18} color="#8b5cf6" style={{ marginBottom: 6 }} />
            <Text style={styles.statNumber}>{stats.coursesRegistered}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
        </View>

        {!isPro ? (
          <TouchableOpacity
            style={styles.proCard}
            onPress={() => router.push('/billing')}
            accessibilityRole="button"
          >
            <View style={styles.proCardLeft}>
              <View style={styles.proIconWrap}>
                <MaterialIcons name="auto-awesome" size={20} color="#0d6cf2" />
              </View>
              <View style={styles.proCardTextWrap}>
                <Text style={styles.proCardTitle}>Unlock more with Pro</Text>
                <Text style={styles.proCardSubtitle}>Unlimited CVs, tailoring & job-fit checks</Text>
              </View>
            </View>
            <View style={styles.proCardRight}>
              <Text style={styles.proCardCta}>View options</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.chevron} />
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full name</Text>
            <TextInput
              style={styles.fieldInput}
              value={profileForm.full_name}
              onChangeText={(value) => setProfileForm((prev) => ({ ...prev, full_name: value }))}
              placeholder="Jane Doe"
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputDisabled]}
              value={profileForm.email}
              editable={false}
              placeholder="you@email.com"
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput
              style={styles.fieldInput}
              value={profileForm.phone}
              onChangeText={(value) => setProfileForm((prev) => ({ ...prev, phone: value }))}
              placeholder="(+1) 555 000 0000"
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Country</Text>
            <TextInput
              style={styles.fieldInput}
              value={profileForm.country}
              onChangeText={(value) => setProfileForm((prev) => ({ ...prev, country: value }))}
              placeholder="Country of residence"
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>LinkedIn</Text>
            <TextInput
              style={styles.fieldInput}
              value={profileForm.linkedin}
              onChangeText={(value) => setProfileForm((prev) => ({ ...prev, linkedin: value }))}
              placeholder="linkedin.com/in/janedoe"
              placeholderTextColor={colors.inputPlaceholder}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Portfolio</Text>
            <TextInput
              style={styles.fieldInput}
              value={profileForm.portfolio}
              onChangeText={(value) => setProfileForm((prev) => ({ ...prev, portfolio: value }))}
              placeholder="janedoe.com"
              placeholderTextColor={colors.inputPlaceholder}
              autoCapitalize="none"
            />
          </View>
          <PrimaryButton
            label={savingProfile ? 'Saving...' : 'Save Profile'}
            onPress={handleProfileSave}
            disabled={savingProfile}
            style={styles.saveProfileButton}
          />
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.menuGroupLabel}>My Content</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon="description" iconColor="#0d6cf2" title="My CVs" onPress={() => router.push('/my-cvs')} colors={colors} />
            <MenuItem icon="school" iconColor="#8b5cf6" title="My Courses" onPress={() => router.push('/my-courses')} colors={colors} />
            <MenuItem icon="emoji-events" iconColor="#f59e0b" title="My Interviews" onPress={() => router.push('/my-interviews')} last colors={colors} />
          </View>

          <Text style={styles.menuGroupLabel}>Career Tools</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon="track-changes" iconColor="#10b981" title="Daily Job Matches" onPress={() => router.push('/daily-matches')} colors={colors} />
            <MenuItem icon="mic" iconColor="#3b82f6" title="Interview Practice" onPress={() => router.push('/interview-prep')} colors={colors} />
            <MenuItem icon="favorite" iconColor="#ef4444" title="Saved Jobs" onPress={() => router.push('/saved-jobs')} last colors={colors} />
          </View>

          <Text style={styles.menuGroupLabel}>Account</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon="credit-card" iconColor="#0d6cf2" title="Billing" onPress={() => router.push('/billing')} colors={colors} />
            <MenuItem icon="settings" iconColor={colors.textDim} title="Settings" onPress={() => router.push('/settings')} colors={colors} />
            <MenuItem icon="help-outline" iconColor={colors.textDim} title="Help & Support" onPress={() => router.push('/support')} last colors={colors} />
          </View>

          <View style={[styles.menuGroup, { marginTop: 8 }]}>
            <MenuItem icon="delete-outline" iconColor="#ef4444" title="Delete Account" onPress={handleDeleteAccount} danger loading={deleting} colors={colors} />
            <MenuItem icon="logout" iconColor="#ef4444" title="Sign Out" onPress={handleSignOut} danger last colors={colors} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const MenuItem = ({
  icon,
  iconColor,
  title,
  onPress,
  danger = false,
  loading = false,
  last = false,
  colors,
}: {
  icon: string;
  iconColor: string;
  title: string;
  onPress: () => void;
  danger?: boolean;
  loading?: boolean;
  last?: boolean;
  colors: AppColors;
}) => {
  const styles = makeStyles(colors);
  return (
    <TouchableOpacity
      style={[styles.menuItem, !last && styles.menuItemBorder]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconWrap, { backgroundColor: iconColor + '22' }]}>
          <MaterialIcons name={icon as any} size={19} color={iconColor} />
        </View>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
          {title}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color="#ef4444" />
      ) : (
        <MaterialIcons name="chevron-right" size={20} color={colors.chevron} />
      )}
    </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerOffset: {
    paddingTop: 0,
  },
  headerWrapper: {
    backgroundColor: colors.background,
  },
  safeTop: {
    backgroundColor: colors.background,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0d6cf2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -6,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.badgeBg,
    borderWidth: 1,
    borderColor: colors.badgeBorder,
  },
  avatarBadgeText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'center',
    fontWeight: '600',
  },
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  proCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  proCardTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  proCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
  },
  proIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 108, 242, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  proCardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  proCardCta: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  menuSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  menuGroupLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 20,
    marginLeft: 4,
  },
  menuGroup: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  menuTitleDanger: {
    color: '#f87171',
  },
  continueCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  continueTextWrap: {
    gap: 6,
  },
  continueTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  continueSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  continueButton: {
    width: '100%',
  },
  profileSection: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  fieldInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    color: colors.textPrimary,
    paddingHorizontal: 12,
  },
  fieldInputDisabled: {
    opacity: 0.6,
  },
  saveProfileButton: {
    marginTop: 6,
  },
});
