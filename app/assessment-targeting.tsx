import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { isValidCountryName, resolveCountryName } from '@/data/countryDialCodes';

const FREE_CV_DOWNLOAD_KEY = 'gr_free_cv_downloaded';

const countryOptions = [
  { label: 'Luxembourg', value: 'Luxembourg', flag: '🇱🇺' },
  { label: 'Germany', value: 'Germany', flag: '🇩🇪' },
  { label: 'Canada', value: 'Canada', flag: '🇨🇦' },
  { label: 'UK', value: 'United Kingdom', flag: '🇬🇧' },
  { label: 'Global', value: 'Global', flag: '🌐' },
  { label: 'Other', value: 'Other', flag: '🌍' },
];


const jobTypes = [
  { label: 'Skilled / Professional', value: 'skilled', icon: 'engineering' },
  { label: 'Not sure yet', value: 'unsure', icon: 'help-outline' },
];

const statusOptions = [
  { label: 'In my home country', value: 'home', icon: 'home' },
  { label: 'Already abroad', value: 'abroad', icon: 'flight-takeoff' },
];

export default function AssessmentTargetingScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { assessmentData, updateAssessment, nextStep, saveDraft } = useAssessment();
  const { isPro } = useSubscription();

  const existingCountry = assessmentData.targetCountry || '';
  const isPresetCountry = countryOptions.some((c) => c.value === existingCountry);
  const [selectedCountry, setSelectedCountry] = useState(
    isPresetCountry ? existingCountry : 'Other'
  );
  const [otherCountry, setOtherCountry] = useState(
    !isPresetCountry && existingCountry ? existingCountry : ''
  );
  const [selectedJobType, setSelectedJobType] = useState(
    assessmentData.jobSector || 'skilled'
  );
  const [currentStatus, setCurrentStatus] = useState(
    assessmentData.currentStatus || 'home'
  );

  const handleContinue = async () => {
    // Free plan: only 1 CV creation allowed
    if (!isPro) {
      const used = await AsyncStorage.getItem(FREE_CV_DOWNLOAD_KEY);
      if (used === 'true') {
        Alert.alert(
          'CV Limit Reached',
          'Free plan includes 1 CV. Upgrade to Pro for unlimited CVs, tailoring, and downloads.',
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade to Pro', onPress: () => router.push('/billing') },
          ]
        );
        return;
      }
    }

    const targetCountry =
      selectedCountry === 'Other'
        ? resolveCountryName(otherCountry) || otherCountry.trim()
        : selectedCountry;

    if (selectedCountry === 'Other') {
      if (!otherCountry.trim()) {
        Alert.alert('Enter a country', 'Please type your target country.');
        return;
      }
      if (!isValidCountryName(otherCountry)) {
        Alert.alert('Invalid country', 'Please enter a valid country name.');
        return;
      }
    }

    const payload = {
      targetCountry,
      jobSector: selectedJobType,
      currentStatus,
    };
    updateAssessment(payload);
    try {
      await saveDraft('/cv-personal-details', payload);
      nextStep();
      router.push('/cv-personal-details');
    } catch (error: any) {
      Alert.alert('Unable to continue', error?.message || 'Please try again.');
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={router.back}>
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Targeting</Text>
          <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/landing')}>
            <MaterialIcons name="home" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <Text style={styles.title}>Let's set your target.</Text>
            <Text style={styles.subtitle}>
              Define your Work Abroad goals to generate your roadmap.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Which country are you targeting?</Text>
            <View style={styles.chipWrap}>
              {countryOptions.map((country) => {
                const active = selectedCountry === country.value;
                return (
                  <TouchableOpacity
                    key={country.value}
                    style={[styles.countryChip, active && styles.countryChipActive]}
                    onPress={() => setSelectedCountry(country.value)}
                  >
                    <Text style={styles.countryFlag}>{country.flag}</Text>
                    <Text style={[styles.countryLabel, active && styles.countryLabelActive]}>
                      {country.label}
                    </Text>
                    {active && (
                      <MaterialIcons name="check" size={16} color="#fff" style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {selectedCountry === 'Other' && selectedCountry !== 'Global' ? (
            <View style={styles.otherCountryWrap}>
              <Text style={styles.otherCountryLabel}>Type your country</Text>
              <TextInput
                style={styles.otherCountryInput}
                placeholder="Enter your country"
                placeholderTextColor="#6b7280"
                value={otherCountry}
                onChangeText={setOtherCountry}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {otherCountry.trim().length > 0 ? (
                <Text style={styles.otherCountryHint}>
                  {isValidCountryName(otherCountry)
                    ? `Detected: ${resolveCountryName(otherCountry) || otherCountry}`
                    : 'Please enter a valid country name.'}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What type of job are you looking for?</Text>
            <View style={styles.optionList}>
              {jobTypes.map((type) => {
                const active = selectedJobType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[styles.optionCard, active && styles.optionCardActive]}
                    onPress={() => setSelectedJobType(type.value)}
                  >
                    <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                      <MaterialIcons name={type.icon} size={18} color={active ? '#fff' : '#9fb3d0'} />
                    </View>
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {type.label}
                    </Text>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Where are you currently?</Text>
            <View style={styles.statusGrid}>
              {statusOptions.map((option) => {
                const active = currentStatus === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.statusCard, active && styles.statusCardActive]}
                    onPress={() => setCurrentStatus(option.value)}
                  >
                    <View style={[styles.statusIcon, active && styles.statusIconActive]}>
                      <MaterialIcons name={option.icon} size={24} color={active ? '#fff' : '#9fb3d0'} />
                    </View>
                    <Text style={[styles.statusText, active && styles.statusTextActive]}>
                      {option.label}
                    </Text>
                    {active && (
                      <View style={styles.statusCheck}>
                        <MaterialIcons name="check" size={14} color={colors.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cta} onPress={handleContinue}>
            <Text style={styles.ctaText}>Next Step</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  headerStep: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: c.surfaceAlt,
  },
  progressFill: {
    height: '100%',
    width: '50%',
    backgroundColor: c.primary,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
  content: {
    padding: 16,
    paddingBottom: 140,
    gap: 20,
  },
  intro: {
    gap: 6,
  },
  title: {
    color: c.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 15,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#1a2433',
  },
  countryChipActive: {
    backgroundColor: c.primary,
  },
  countryFlag: {
    fontSize: 16,
  },
  countryLabel: {
    color: c.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  countryLabelActive: {
    color: '#fff',
  },
  checkIcon: {
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: c.surfaceAlt,
  },
  otherCountryWrap: {
    gap: 8,
  },
  otherCountryLabel: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  otherCountryInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#1a2433',
    color: c.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  otherCountryHint: {
    color: c.textSecondary,
    fontSize: 11,
  },
  optionList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#1a2433',
  },
  optionCardActive: {
    backgroundColor: 'rgba(13,108,242,0.18)',
    borderWidth: 1,
    borderColor: c.primary,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#223249',
  },
  optionIconActive: {
    backgroundColor: c.primary,
  },
  optionText: {
    flex: 1,
    marginHorizontal: 12,
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#fff',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: c.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: c.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: c.primary,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statusCard: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#1a2433',
  },
  statusCardActive: {
    backgroundColor: c.primary,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#223249',
    marginBottom: 8,
  },
  statusIconActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statusText: {
    color: c.textPrimary,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#fff',
  },
  statusCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: c.background,
  },
  cta: {
    height: 54,
    borderRadius: 999,
    backgroundColor: c.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
