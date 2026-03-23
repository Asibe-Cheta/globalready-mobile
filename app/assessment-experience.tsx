import { MaterialIcons } from '@expo/vector-icons';
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

const experienceOptions = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Less than 1 year' },
  { value: 3, label: '1-3 years' },
  { value: 5, label: '3+ years' },
];

const educationOptions = [
  { value: 'high_school', label: 'Secondary school' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: "Bachelor's degree" },
  { value: 'masters', label: "Master's or higher" },
];

const certificateOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Not sure' },
];

export default function AssessmentExperienceScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { assessmentData, updateAssessment, nextStep, saveDraft } = useAssessment();

  const [yearsExperience, setYearsExperience] = useState<number | undefined>(
    assessmentData.yearsExperience
  );
  const [profession, setProfession] = useState(assessmentData.profession || '');
  const [techDomain, setTechDomain] = useState<boolean | undefined>(
    assessmentData.techDomain
  );
  const [healthcareDomain, setHealthcareDomain] = useState<boolean | undefined>(
    assessmentData.healthcareDomain
  );
  const [educationLevel, setEducationLevel] = useState<string | undefined>(
    assessmentData.educationLevel
  );
  const [certificatesStatus, setCertificatesStatus] = useState<
    'yes' | 'no' | 'unsure' | undefined
  >(assessmentData.certificatesStatus);

  const handleContinue = async () => {
    if (
      yearsExperience === undefined ||
      !educationLevel ||
      techDomain === undefined ||
      healthcareDomain === undefined ||
      !certificatesStatus
    ) {
      Alert.alert('Error', 'Please complete all fields');
      return;
    }

    updateAssessment({
      yearsExperience,
      educationLevel,
      fieldOfStudy: profession || assessmentData.jobSector || 'Work Abroad',
      profession: profession || undefined,
      techDomain,
      healthcareDomain,
      certificatesStatus,
    });
    await saveDraft('/assessment-language');
    nextStep();
    router.push('/assessment-language');
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={router.back}>
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Experience & Education</Text>
          <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/landing')}>
            <MaterialIcons name="home" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            <Text style={styles.sectionSubtitle}>
              How many years of relevant work experience do you have?
            </Text>
            <View style={styles.optionList}>
              {experienceOptions.map((option) => {
                const active = yearsExperience === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.optionCard, active && styles.optionCardActive]}
                    onPress={() => setYearsExperience(option.value)}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {option.label}
                    </Text>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <MaterialIcons name="check" size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Profession</Text>
            <Text style={styles.sectionSubtitle}>What is your current profession?</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="work" size={18} color={colors.textSecondary} />
              <TextInput
                value={profession}
                onChangeText={setProfession}
                placeholder="e.g. Software Engineer"
                placeholderTextColor={colors.inputPlaceholder}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tech Domain</Text>
            <Text style={styles.sectionSubtitle}>
              Are you in the Tech domain (e.g., software development, IT)?
            </Text>
            <View style={styles.binaryGrid}>
              <TouchableOpacity
                style={[styles.binaryCard, techDomain === true && styles.binaryCardActive]}
                onPress={() => setTechDomain(true)}
              >
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={techDomain === true ? colors.primary : colors.textSecondary}
                />
                <Text style={styles.binaryText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.binaryCard, techDomain === false && styles.binaryCardActive]}
                onPress={() => setTechDomain(false)}
              >
                <MaterialIcons
                  name="cancel"
                  size={20}
                  color={techDomain === false ? colors.primary : colors.textSecondary}
                />
                <Text style={styles.binaryText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Healthcare Domain</Text>
            <Text style={styles.sectionSubtitle}>
              Are you in the Healthcare domain (e.g., nursing, doctor)?
            </Text>
            <View style={styles.binaryGrid}>
              <TouchableOpacity
                style={[styles.binaryCard, healthcareDomain === true && styles.binaryCardActive]}
                onPress={() => setHealthcareDomain(true)}
              >
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={healthcareDomain === true ? colors.primary : colors.textSecondary}
                />
                <Text style={styles.binaryText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.binaryCard, healthcareDomain === false && styles.binaryCardActive]}
                onPress={() => setHealthcareDomain(false)}
              >
                <MaterialIcons
                  name="cancel"
                  size={20}
                  color={healthcareDomain === false ? colors.primary : colors.textSecondary}
                />
                <Text style={styles.binaryText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            <Text style={styles.sectionSubtitle}>What is your highest level of education?</Text>
            <View style={styles.chipWrap}>
              {educationOptions.map((option) => {
                const active = educationLevel === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setEducationLevel(option.value)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certificates</Text>
            <Text style={styles.sectionSubtitle}>Do you have any job-related certificates?</Text>
            <View style={styles.certificateGrid}>
              {certificateOptions.map((option) => {
                const active = certificatesStatus === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.binaryCard, active && styles.binaryCardActive]}
                    onPress={() => setCertificatesStatus(option.value as 'yes' | 'no' | 'unsure')}
                  >
                    <MaterialIcons
                      name={
                        option.value === 'yes'
                          ? 'check-circle'
                          : option.value === 'no'
                          ? 'cancel'
                          : 'help'
                      }
                      size={20}
                      color={active ? colors.primary : colors.textSecondary}
                    />
                    <Text style={styles.binaryText}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cta} onPress={handleContinue}>
            <Text style={styles.ctaText}>Continue</Text>
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
    fontSize: 16,
    fontWeight: '700',
  },
  headerStep: {
    color: c.primary,
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
    padding: 20,
    paddingBottom: 150,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: c.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: c.textSecondary,
    fontSize: 13,
  },
  optionList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    backgroundColor: c.surface,
  },
  optionCardActive: {
    backgroundColor: 'rgba(13,108,242,0.12)',
    borderWidth: 1,
    borderColor: c.primary,
  },
  optionText: {
    color: c.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  optionTextActive: {
    color: c.primary,
    fontWeight: '700',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: c.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: c.surface,
  },
  input: {
    flex: 1,
    color: c.textPrimary,
    fontSize: 15,
  },
  binaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  certificateGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  binaryCard: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  binaryCardActive: {
    borderColor: c.primary,
    backgroundColor: 'rgba(13,108,242,0.12)',
  },
  binaryText: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  chipText: {
    color: c.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    paddingBottom: 28,
    backgroundColor: 'rgba(16,24,35,0.94)',
  },
  cta: {
    height: 56,
    borderRadius: 999,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
