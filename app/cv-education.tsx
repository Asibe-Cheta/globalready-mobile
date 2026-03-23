import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
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
import { SecondaryButton } from '@/components/ui/secondary-button';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { useCVBuilder } from '@/hooks/useCVBuilder';
export default function CvEducationScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [currentlyStudying, setCurrentlyStudying] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [degree, setDegree] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [dropdownType, setDropdownType] = useState<'country' | 'university' | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showCountryFirst, setShowCountryFirst] = useState(false);
  const [educationIndex, setEducationIndex] = useState<number | null>(null);
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { cvData, addEducation, updateEducation, removeEducation, saveDraft, setCurrentStep } = useCVBuilder();
  const lastSavedRef = useRef<string>('');

  const countryOptions = ['United Kingdom', 'Germany', 'Ghana', 'Nigeria'];
  const universitiesByCountry: Record<string, string[]> = {
    'United Kingdom': [
      'King\'s College London',
      'London School of Economics and Political Science',
      'Queen Mary University of London',
      'University of Birmingham',
      'University of Bristol',
      'University of Edinburgh',
      'University of Glasgow',
      'University of Leeds',
      'University of Nottingham',
      'University of Oxford',
      'University of Cambridge',
      'Imperial College London',
      'University College London',
      'University of Manchester',
    ],
    Germany: [
      'Charite - Universitatsmedizin Berlin',
      'Dresden University of Technology',
      'Free University of Berlin',
      'Goethe University Frankfurt',
      'Karlsruhe Institute of Technology',
      'Ludwig Maximilian University of Munich',
      'Saarland University',
      'University of Bonn',
      'University of Hamburg',
      'University of Tubingen',
      'Technical University of Munich',
      'RWTH Aachen University',
      'Heidelberg University',
      'Humboldt University of Berlin',
      'University of Freiburg',
    ],
    Ghana: [
      'African University College of Communications',
      'Central University',
      'Ghana Institute of Management and Public Administration',
      'Kwame Nkrumah University of Science and Technology',
      'University of Education, Winneba',
      'University of Ghana',
      'University of Cape Coast',
      'Ashesi University',
      'University for Development Studies',
    ],
    Nigeria: [
      'Babcock University',
      'Bayero University Kano',
      'Federal University of Technology, Akure',
      'Lagos State University',
      'Nnamdi Azikiwe University',
      'Pan-Atlantic University',
      'University of Abuja',
      'University of Benin',
      'University of Ilorin',
      'University of Lagos',
      'University of Ibadan',
      'Obafemi Awolowo University',
      'Ahmadu Bello University',
      'Covenant University',
    ],
  };

  const universityOptions = useMemo(
    () => (selectedCountry ? universitiesByCountry[selectedCountry] || [] : []),
    [selectedCountry]
  );

  const formatDate = (value: Date | null) => {
    if (!value) return '';
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    const yyyy = value.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const openUniversityDropdown = () => {
    if (!selectedCountry) {
      setShowCountryFirst(true);
      return;
    }
    setShowCountryFirst(false);
    setSearchText('');
    setDropdownType('university');
  };

  const filteredOptions = useMemo(() => {
    const base =
      dropdownType === 'country' ? countryOptions : universityOptions;
    if (!searchText.trim()) return base;
    const lower = searchText.trim().toLowerCase();
    return base.filter((option) => option.toLowerCase().includes(lower));
  }, [countryOptions, dropdownType, searchText, universityOptions]);

  // Load last existing education entry for editing on mount
  useEffect(() => {
    if (educationIndex !== null) return;
    const lastIdx = (cvData.education?.length ?? 0) - 1;
    if (lastIdx < 0) return;
    const entry = cvData.education[lastIdx];
    if (!entry) return;
    setSelectedUniversity(entry.school || null);
    setDegree(entry.degree || '');
    setSelectedCountry(entry.location || null);
    setStartDate(entry.startDate ? new Date(entry.startDate) : null);
    setEndDate(entry.endDate ? new Date(entry.endDate) : null);
    setCurrentlyStudying(Boolean(entry.current));
    setEducationIndex(lastIdx);
    lastSavedRef.current = JSON.stringify(entry);
  }, []); // run once on mount

  const clearForm = () => {
    setSelectedUniversity(null);
    setDegree('');
    setSelectedCountry(null);
    setStartDate(null);
    setEndDate(null);
    setCurrentlyStudying(false);
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const handleDeleteEducation = (idx: number) => {
    Alert.alert('Delete education?', 'This will remove this entry from your CV.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeEducation(idx);
          if (educationIndex === idx) {
            clearForm();
            setEducationIndex(null);
            lastSavedRef.current = '';
          } else if (educationIndex !== null && idx < educationIndex) {
            setEducationIndex(educationIndex - 1);
          }
          saveDraft().catch(() => undefined);
        },
      },
    ]);
  };

  const handleAddAnother = () => {
    if (!hasAnyInput) return;
    clearForm();
    setEducationIndex(null);
    lastSavedRef.current = '';
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  useEffect(() => {
    if (currentlyStudying && endDate) {
      setEndDate(null);
    }
  }, [currentlyStudying, endDate]);

  const payload = useMemo(
    () => ({
      school: selectedUniversity || '',
      degree: degree.trim(),
      location: selectedCountry || undefined,
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: currentlyStudying ? undefined : endDate ? endDate.toISOString() : undefined,
      current: currentlyStudying,
    }),
    [selectedUniversity, degree, selectedCountry, startDate, endDate, currentlyStudying]
  );

  const hasAnyInput = Boolean(
    payload.school ||
      payload.degree ||
      payload.location ||
      payload.startDate ||
      payload.endDate ||
      payload.current
  );

  useEffect(() => {
    const serialized = JSON.stringify(payload);
    if (serialized === lastSavedRef.current) return;
    if (!hasAnyInput) return;

    if (educationIndex === null) {
      addEducation(payload);
      const newIdx = cvData.education?.length ?? 0;
      setEducationIndex(newIdx);
    } else {
      updateEducation(educationIndex, payload);
    }

    lastSavedRef.current = serialized;
    setCurrentStep(4);
    saveDraft().catch(() => undefined);
  }, [
    payload,
    hasAnyInput,
    educationIndex,
    addEducation,
    updateEducation,
    setCurrentStep,
    saveDraft,
    cvData.education,
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Education</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/landing')}
            accessibilityRole="button"
          >
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressRow}>
            <Text style={styles.progressStep}>Step 2 of 5</Text>
            <Text style={styles.progressPercent}>40%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {cvData.education?.length > 0 ? (
            <View style={styles.entryList}>
              {cvData.education.map((edu: any, idx: number) => (
                idx !== educationIndex ? (
                  <View key={idx} style={styles.entryCard}>
                    <TouchableOpacity
                      style={styles.entryInfo}
                      onPress={() => {
                        setEducationIndex(idx);
                        setSelectedUniversity(edu.school || null);
                        setDegree(edu.degree || '');
                        setSelectedCountry(edu.location || null);
                        setStartDate(edu.startDate ? new Date(edu.startDate) : null);
                        setEndDate(edu.endDate ? new Date(edu.endDate) : null);
                        setCurrentlyStudying(Boolean(edu.current));
                        lastSavedRef.current = JSON.stringify(edu);
                      }}
                      accessibilityRole="button"
                    >
                      <Text style={styles.entryTitle}>{edu.school || 'Untitled'}</Text>
                      <Text style={styles.entrySubtitle}>{edu.degree || ''}</Text>
                    </TouchableOpacity>
                    <View style={styles.entryActions}>
                      <TouchableOpacity
                        style={styles.entryActionBtn}
                        onPress={() => {
                          setEducationIndex(idx);
                          setSelectedUniversity(edu.school || null);
                          setDegree(edu.degree || '');
                          setSelectedCountry(edu.location || null);
                          setStartDate(edu.startDate ? new Date(edu.startDate) : null);
                          setEndDate(edu.endDate ? new Date(edu.endDate) : null);
                          setCurrentlyStudying(Boolean(edu.current));
                          lastSavedRef.current = JSON.stringify(edu);
                        }}
                        accessibilityRole="button"
                      >
                        <MaterialIcons name="edit" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.entryActionBtn}
                        onPress={() => handleDeleteEducation(idx)}
                        accessibilityRole="button"
                      >
                        <MaterialIcons name="delete-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null
              ))}
            </View>
          ) : null}

          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <MaterialIcons name="lightbulb" size={20} color={colors.primary} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Pro Tip</Text>
              <Text style={styles.tipText}>
                Highlight education relevant to your career goals or the target role to stand out.
              </Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>University / Institution Name</Text>
            <Pressable style={styles.inputWrap} onPress={openUniversityDropdown}>
              <MaterialIcons name="school" size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <Text style={[styles.input, styles.selectText, !selectedUniversity && styles.placeholderText]}>
                {selectedUniversity || 'Select a university'}
              </Text>
              <MaterialIcons name="expand-more" size={20} color={colors.textSecondary} style={styles.selectIcon} />
            </Pressable>
            {showCountryFirst ? (
              <View style={styles.countryFirstBanner}>
                <MaterialIcons name="info-outline" size={16} color="#f59e0b" />
                <Text style={styles.countryFirstText}>Please select a country first.</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowCountryFirst(false);
                    setSearchText('');
                    setDropdownType('country');
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.countryFirstLink}>Select Country</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Degree / Qualification</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons
                name="workspace-premium"
                size={18}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. Bachelor of Computer Science"
                placeholderTextColor={colors.inputPlaceholder}
                value={degree}
                onChangeText={setDegree}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Location</Text>
            <Pressable
              style={styles.inputWrap}
              onPress={() => {
                setSearchText('');
                setDropdownType('country');
              }}
            >
              <MaterialIcons name="location-on" size={18} color={colors.textSecondary} style={styles.inputIcon} />
              <Text style={[styles.input, styles.selectText, !selectedCountry && styles.placeholderText]}>
                {selectedCountry || 'Select country'}
              </Text>
              <MaterialIcons name="expand-more" size={20} color={colors.textSecondary} style={styles.selectIcon} />
            </Pressable>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Duration</Text>
            <View style={styles.row}>
              <Pressable style={styles.dateInput} onPress={() => setShowStartPicker(true)}>
                <Text style={[styles.dateText, !startDate && styles.placeholderText]}>
                  {startDate ? formatDate(startDate) : 'Start date'}
                </Text>
                <MaterialIcons name="calendar-month" size={18} color={colors.textSecondary} />
              </Pressable>
              <Pressable
                style={[styles.dateInput, currentlyStudying && styles.dateInputDisabled]}
                onPress={() => {
                  if (!currentlyStudying) setShowEndPicker(true);
                }}
              >
                <Text style={[styles.dateText, !endDate && styles.placeholderText]}>
                  {endDate ? formatDate(endDate) : 'End date'}
                </Text>
                <MaterialIcons name="calendar-month" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {showStartPicker ? (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant="dark"
                onChange={(_, date) => {
                  setShowStartPicker(Platform.OS === 'ios');
                  if (date) setStartDate(date);
                }}
              />
              {Platform.OS === 'ios' ? (
                <TouchableOpacity
                  style={styles.pickerDone}
                  onPress={() => setShowStartPicker(false)}
                  accessibilityRole="button"
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {showEndPicker ? (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={endDate || startDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant="dark"
                onChange={(_, date) => {
                  setShowEndPicker(Platform.OS === 'ios');
                  if (date) setEndDate(date);
                }}
                disabled={currentlyStudying}
              />
              {Platform.OS === 'ios' ? (
                <TouchableOpacity
                  style={styles.pickerDone}
                  onPress={() => setShowEndPicker(false)}
                  accessibilityRole="button"
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <Pressable style={styles.toggleRow} onPress={() => setCurrentlyStudying(!currentlyStudying)}>
            <View>
              <Text style={styles.toggleTitle}>Currently studying here</Text>
              <Text style={styles.toggleHint}>If enabled, end date will be hidden</Text>
            </View>
            <View style={[styles.toggleTrack, currentlyStudying && styles.toggleTrackActive]}>
              <View style={[styles.toggleThumb, currentlyStudying && styles.toggleThumbActive]} />
            </View>
          </Pressable>
        </ScrollView>

        <View style={styles.bottomBar}>
          <SecondaryButton label="Add Another Education" icon="add-circle" onPress={handleAddAnother} />
          <PrimaryButton label="Save Education" icon="check" onPress={() => {
            saveDraft().catch(() => undefined);
            router.push('/cv-certifications');
          }} />
        </View>
      </View>

      <Modal visible={dropdownType !== null} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setDropdownType(null)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {dropdownType === 'country' ? 'Select Country' : 'Select University'}
              </Text>
              <TouchableOpacity onPress={() => setDropdownType(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchRow}>
              <MaterialIcons name="search" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={
                  dropdownType === 'country' ? 'Search countries' : 'Search universities'
                }
                placeholderTextColor={colors.inputPlaceholder}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
            <ScrollView
              contentContainerStyle={styles.modalList}
              keyboardShouldPersistTaps="handled"
            >
              {filteredOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.modalOption}
                  onPress={() => {
                    if (dropdownType === 'country') {
                      setSelectedCountry(option);
                      setShowCountryFirst(false);
                      if (selectedUniversity && !universitiesByCountry[option]?.includes(selectedUniversity)) {
                        setSelectedUniversity(null);
                      }
                    } else {
                      setSelectedUniversity(option);
                    }
                    setDropdownType(null);
                  }}
                >
                  <Text style={styles.modalOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
              {dropdownType === 'university' && universityOptions.length === 0 ? (
                <Text style={styles.modalEmpty}>Select a country to view universities.</Text>
              ) : null}
              {searchText.trim() && filteredOptions.length === 0 ? (
                <View style={styles.modalEmptyWrap}>
                  <Text style={styles.modalEmpty}>Not found.</Text>
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      const typed = searchText.trim();
                      if (!typed) return;
                      if (dropdownType === 'country') {
                        setSelectedCountry(typed);
                      } else {
                        setSelectedUniversity(typed);
                      }
                      setDropdownType(null);
                    }}
                  >
                    <Text style={styles.modalOptionText}>Use "{searchText.trim()}"</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setDropdownType(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  progressWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressStep: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressPercent: {
    color: c.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '40%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: c.primary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 200,
  },
  tipCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 20,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13,108,242,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipText: {
    color: c.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: 'rgba(226,232,240,0.9)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
  },
  selectIcon: {
    position: 'absolute',
    right: 12,
  },
  input: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: c.surface,
    color: c.textPrimary,
    paddingLeft: 40,
    paddingRight: 16,
  },
  selectText: {
    textAlignVertical: 'center',
    paddingTop: 16,
    paddingBottom: 16,
  },
  placeholderText: {
    color: c.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: c.surface,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInputDisabled: {
    opacity: 0.5,
  },
  dateText: {
    color: c.textPrimary,
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  pickerWrap: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: c.surface,
    overflow: 'hidden',
  },
  pickerDone: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pickerDoneText: {
    color: c.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: c.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: {
    color: c.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  modalClose: {
    color: c.textSecondary,
    fontSize: 20,
    fontWeight: '600',
  },
  modalList: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modalSearchInput: {
    flex: 1,
    color: c.textPrimary,
    fontSize: 13,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modalOptionText: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  modalCancel: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(148,163,184,0.15)',
  },
  modalCancelText: {
    color: c.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  modalEmpty: {
    color: c.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
  modalEmptyWrap: {
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 6,
  },
  toggleTitle: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleHint: {
    color: c.textSecondary,
    fontSize: 11,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.3)',
    padding: 3,
  },
  toggleTrackActive: {
    backgroundColor: c.primary,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    transform: [{ translateX: 0 }],
  },
  toggleThumbActive: {
    transform: [{ translateX: 18 }],
  },
  countryFirstBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  countryFirstText: {
    flex: 1,
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '500',
  },
  countryFirstLink: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  entryList: {
    marginBottom: 16,
    gap: 8,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  entryInfo: {
    flex: 1,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  entryActionBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  entryTitle: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  entrySubtitle: {
    color: c.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
    backgroundColor: c.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
});
