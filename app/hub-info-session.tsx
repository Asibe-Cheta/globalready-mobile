import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { supabase } from '@/lib/supabase';
import { coursesService, type VirtualSession } from '@/services/supabase/courses';

const goalOptions = [
  'Get a remote job',
  'Build a side income',
  'Relocate abroad',
  'Learn new skills',
];

function formatSessionDay(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = days[date.getUTCDay()];
  const month = months[date.getUTCMonth()];
  const dateNum = date.getUTCDate();
  const suffix = dateNum === 1 || dateNum === 21 || dateNum === 31 ? 'st'
    : dateNum === 2 || dateNum === 22 ? 'nd'
    : dateNum === 3 || dateNum === 23 ? 'rd' : 'th';
  return `${day}, ${month} ${dateNum}${suffix}`;
}

function formatSessionTime(dateStr: string, tz: string): string {
  const date = new Date(dateStr);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const minStr = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ':00';
  return `${hour12}${minStr} ${ampm} ${tz}`;
}

export default function HubInfoSessionScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [consent, setConsent] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [goalDropdownOpen, setGoalDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<VirtualSession | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId?: string; courseName?: string }>();
  const courseId = params?.courseId;
  const courseName = params?.courseName ? decodeURIComponent(params.courseName) : '';

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single();

      if (data) {
        setFullName((prev) => prev || data.full_name || '');
        setEmail((prev) => prev || data.email || '');
        setPhone((prev) => prev || data.phone || '');
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (!courseId) return;
    coursesService.getVirtualSession(courseId).then(setSession).catch(() => undefined);
  }, [courseId]);

  const handleRegister = async () => {
    if (!courseId) return;
    if (!fullName.trim() || !email.trim()) return;

    try {
      setSaving(true);
      await coursesService.registerForCourse(courseId, {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        occupation: occupation.trim() || undefined,
        primary_goal: primaryGoal || undefined,
        consent,
      });
      router.push('/registration-confirmed');
    } catch (err: any) {
      const { Alert } = require('react-native');
      Alert.alert(
        'Registration Failed',
        err.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Register for Hub Info Session</Text>
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
            <View style={styles.sessionInfo}>
              {session ? (
                <>
                  <View style={styles.sessionRow}>
                    <MaterialIcons name="calendar-today" size={16} color={colors.primary} />
                    <Text style={styles.sessionTitle}>{formatSessionDay(session.session_date)}</Text>
                  </View>
                  <View style={styles.sessionRow}>
                    <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
                    <Text style={styles.sessionMeta}>
                      {formatSessionTime(session.session_date, session.timezone)} • {session.location}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.sessionRow}>
                    <MaterialIcons name="calendar-today" size={16} color={colors.primary} />
                    <Text style={styles.sessionTitle}>Session date to be announced</Text>
                  </View>
                  <View style={styles.sessionRow}>
                    <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
                    <Text style={styles.sessionMeta}>Virtual Room</Text>
                  </View>
                </>
              )}
            </View>
            <View style={styles.sessionImage}>
              <MaterialIcons name="videocam" size={28} color={colors.primary} />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Course of Interest</Text>
            <View style={styles.courseDisplay}>
              <MaterialIcons name="school" size={18} color={colors.primary} />
              <Text style={styles.courseDisplayText}>
                {courseName || 'No course selected'}
              </Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={colors.inputPlaceholder}
              value={fullName}
              onChangeText={setFullName}
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
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.formSection}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Phone / WhatsApp</Text>
              <Text style={styles.optional}>Optional</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={colors.inputPlaceholder}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Current Occupation</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Student, Marketer, Designer"
              placeholderTextColor={colors.inputPlaceholder}
              value={occupation}
              onChangeText={setOccupation}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Primary Goal</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setGoalDropdownOpen(!goalDropdownOpen)}
              accessibilityRole="button"
            >
              <Text style={primaryGoal ? styles.selectValue : styles.selectPlaceholder}>
                {primaryGoal || 'Select your goal'}
              </Text>
              <MaterialIcons
                name={goalDropdownOpen ? 'expand-less' : 'expand-more'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {goalDropdownOpen && (
              <View style={styles.dropdown}>
                {goalOptions.map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    style={[styles.dropdownItem, primaryGoal === goal && styles.dropdownItemSelected]}
                    onPress={() => {
                      setPrimaryGoal(goal);
                      setGoalDropdownOpen(false);
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.dropdownText, primaryGoal === goal && styles.dropdownTextSelected]}>
                      {goal}
                    </Text>
                    {primaryGoal === goal && (
                      <MaterialIcons name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Pressable style={styles.checkboxRow} onPress={() => setConsent(!consent)}>
            <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
              {consent && <MaterialIcons name="check" size={14} color="#fff" />}
            </View>
            <Text style={styles.checkboxText}>
              I agree to receive event reminders and upskilling opportunities.
            </Text>
          </Pressable>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <PrimaryButton
            label={saving ? 'Saving...' : 'Secure My Spot'}
            icon="arrow-forward"
            onPress={handleRegister}
            disabled={saving || !courseId || !fullName.trim() || !email.trim()}
          />
          <Text style={styles.bottomNote}>Join 2,500+ others who registered this week</Text>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 160,
  },
  sessionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: c.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    padding: 16,
    marginBottom: 16,
  },
  sessionInfo: {
    flex: 1,
    gap: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  sessionMeta: {
    color: c.textSecondary,
    fontSize: 12,
  },
  sessionImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: 'rgba(13,108,242,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSection: {
    marginBottom: 14,
  },
  courseDisplay: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.primary,
    backgroundColor: 'rgba(13,108,242,0.08)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  courseDisplayText: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  optional: {
    color: c.textSecondary,
    fontSize: 11,
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
  selectValue: {
    color: c.textPrimary,
    fontSize: 13,
  },
  dropdown: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(13,108,242,0.1)',
  },
  dropdownText: {
    color: c.textPrimary,
    fontSize: 13,
  },
  dropdownTextSelected: {
    color: c.primary,
    fontWeight: '600',
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
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: c.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  bottomNote: {
    textAlign: 'center',
    color: c.textSecondary,
    fontSize: 11,
  },
});
