import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { Screen } from '@/components/ui/screen';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { useCVBuilder } from '@/hooks/useCVBuilder';

export default function CvCertificationsScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [certName, setCertName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [dateIssued, setDateIssued] = useState<Date | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [noExpiration, setNoExpiration] = useState(false);
  const [showIssuedPicker, setShowIssuedPicker] = useState(false);
  const [showExpirationPicker, setShowExpirationPicker] = useState(false);
  const [certIndex, setCertIndex] = useState<number | null>(null);

  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { cvData, addCertification, updateCertification, removeCertification, saveDraft, setCurrentStep } = useCVBuilder();
  const lastSavedRef = useRef<string>('');

  const formatDate = (value: Date | null) => {
    if (!value) return 'mm/dd/yyyy';
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    const yyyy = value.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  // Load last existing certification entry on mount
  useEffect(() => {
    if (certIndex !== null) return;
    const lastIdx = (cvData.certifications?.length ?? 0) - 1;
    if (lastIdx < 0) return;
    const entry = cvData.certifications[lastIdx];
    if (!entry) return;
    setCertName(entry.name || '');
    setIssuer(entry.issuer || '');
    setDateIssued(entry.issuedAt ? new Date(entry.issuedAt) : null);
    setExpirationDate(entry.expiresAt ? new Date(entry.expiresAt) : null);
    setNoExpiration(!entry.expiresAt);
    setCertIndex(lastIdx);
    lastSavedRef.current = JSON.stringify(entry);
  }, []);

  useEffect(() => {
    if (noExpiration && expirationDate) {
      setExpirationDate(null);
    }
  }, [noExpiration, expirationDate]);

  const payload = useMemo(
    () => ({
      name: certName.trim(),
      issuer: issuer.trim(),
      issuedAt: dateIssued ? dateIssued.toISOString() : undefined,
      expiresAt: noExpiration ? undefined : expirationDate ? expirationDate.toISOString() : undefined,
    }),
    [certName, issuer, dateIssued, expirationDate, noExpiration]
  );

  const hasAnyInput = Boolean(
    payload.name || payload.issuer || payload.issuedAt || payload.expiresAt
  );

  // Auto-save effect
  useEffect(() => {
    const serialized = JSON.stringify(payload);
    if (serialized === lastSavedRef.current) return;
    if (!hasAnyInput) return;

    if (certIndex === null) {
      addCertification(payload);
      const newIdx = cvData.certifications?.length ?? 0;
      setCertIndex(newIdx);
    } else {
      updateCertification(certIndex, payload);
    }

    lastSavedRef.current = serialized;
    setCurrentStep(5);
    saveDraft().catch(() => undefined);
  }, [
    payload,
    hasAnyInput,
    certIndex,
    addCertification,
    updateCertification,
    setCurrentStep,
    saveDraft,
    cvData.certifications,
  ]);

  const clearForm = () => {
    setCertName('');
    setIssuer('');
    setDateIssued(null);
    setExpirationDate(null);
    setNoExpiration(false);
    setShowIssuedPicker(false);
    setShowExpirationPicker(false);
  };

  const handleDeleteCertification = (idx: number) => {
    Alert.alert('Delete certification?', 'This will remove this certification from your CV.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeCertification(idx);
          if (certIndex === idx) {
            clearForm();
            setCertIndex(null);
            lastSavedRef.current = '';
          } else if (certIndex !== null && idx < certIndex) {
            setCertIndex(certIndex - 1);
          }
          saveDraft().catch(() => undefined);
        },
      },
    ]);
  };

  const handleAddAnother = () => {
    if (!hasAnyInput) return;
    clearForm();
    setCertIndex(null);
    lastSavedRef.current = '';
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <Screen>
      <AppHeader
        title="Certifications"
        onBack={router.back}
        right={
          <View style={styles.headerActions}>
            <Text style={styles.saveText}>Save</Text>
            <TouchableOpacity onPress={() => router.push('/landing')} accessibilityRole="button">
              <MaterialIcons name="home" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        }
      />

      <View style={styles.progressWrap}>
        <View style={styles.progressRow}>
          <Text style={styles.progressStep}>Step 3 of 5</Text>
          <Text style={styles.progressPercent}>60% Completed</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>Professional Certifications</Text>
          <Text style={styles.subtitle}>
            Add licenses and certifications to validate your skills and expertise to global employers.
          </Text>
        </View>

        {cvData.certifications?.length > 0 ? (
          <View style={styles.entryList}>
            {cvData.certifications.map((cert: any, idx: number) => (
              idx !== certIndex ? (
                <View key={idx} style={styles.entryCard}>
                  <TouchableOpacity
                    style={styles.entryInfo}
                    onPress={() => {
                      setCertIndex(idx);
                      setCertName(cert.name || '');
                      setIssuer(cert.issuer || '');
                      setDateIssued(cert.issuedAt ? new Date(cert.issuedAt) : null);
                      setExpirationDate(cert.expiresAt ? new Date(cert.expiresAt) : null);
                      setNoExpiration(!cert.expiresAt);
                      lastSavedRef.current = JSON.stringify(cert);
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.entryTitle}>{cert.name || 'Untitled'}</Text>
                    <Text style={styles.entrySubtitle}>{cert.issuer || ''}</Text>
                  </TouchableOpacity>
                  <View style={styles.entryActions}>
                    <TouchableOpacity
                      style={styles.entryActionBtn}
                      onPress={() => {
                        setCertIndex(idx);
                        setCertName(cert.name || '');
                        setIssuer(cert.issuer || '');
                        setDateIssued(cert.issuedAt ? new Date(cert.issuedAt) : null);
                        setExpirationDate(cert.expiresAt ? new Date(cert.expiresAt) : null);
                        setNoExpiration(!cert.expiresAt);
                        lastSavedRef.current = JSON.stringify(cert);
                      }}
                      accessibilityRole="button"
                    >
                      <MaterialIcons name="edit" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.entryActionBtn}
                      onPress={() => handleDeleteCertification(idx)}
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

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Certification Name</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="e.g. AWS Certified Solutions Architect"
              placeholderTextColor={colors.inputPlaceholder}
              style={styles.input}
              value={certName}
              onChangeText={setCertName}
            />
            <MaterialIcons name="verified" size={20} color={colors.textSecondary} style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Issuing Body</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="e.g. Amazon Web Services"
              placeholderTextColor={colors.inputPlaceholder}
              style={styles.input}
              value={issuer}
              onChangeText={setIssuer}
            />
            <MaterialIcons name="corporate-fare" size={20} color={colors.textSecondary} style={styles.inputIcon} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldGroupHalf}>
            <Text style={styles.label}>Date Issued</Text>
            <Pressable style={styles.dateInput} onPress={() => setShowIssuedPicker(true)}>
              <Text style={[styles.dateText, !dateIssued && styles.placeholderText]}>
                {formatDate(dateIssued)}
              </Text>
            </Pressable>
          </View>
          <View style={styles.fieldGroupHalf}>
            <Text style={styles.label}>Expiration Date</Text>
            <Pressable
              style={[styles.dateInput, noExpiration && styles.dateInputDisabled]}
              onPress={() => { if (!noExpiration) setShowExpirationPicker(true); }}
            >
              <Text style={[styles.dateText, (!expirationDate || noExpiration) && styles.placeholderText]}>
                {noExpiration ? 'N/A' : formatDate(expirationDate)}
              </Text>
            </Pressable>
          </View>
        </View>

        {showIssuedPicker ? (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={dateIssued || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              themeVariant="dark"
              onChange={(_, date) => {
                setShowIssuedPicker(Platform.OS === 'ios');
                if (date) setDateIssued(date);
              }}
            />
            {Platform.OS === 'ios' ? (
              <TouchableOpacity style={styles.pickerDone} onPress={() => setShowIssuedPicker(false)} accessibilityRole="button">
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {showExpirationPicker ? (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={expirationDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              themeVariant="dark"
              onChange={(_, date) => {
                setShowExpirationPicker(Platform.OS === 'ios');
                if (date) setExpirationDate(date);
              }}
            />
            {Platform.OS === 'ios' ? (
              <TouchableOpacity style={styles.pickerDone} onPress={() => setShowExpirationPicker(false)} accessibilityRole="button">
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <Pressable style={styles.checkboxRow} onPress={() => setNoExpiration(!noExpiration)}>
          <View style={[styles.checkbox, noExpiration && styles.checkboxChecked]}>
            {noExpiration && <MaterialIcons name="check" size={16} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>No expiration</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.bottomBar}>
        <SecondaryButton label="Add Another Certification" icon="add-circle" onPress={handleAddAnother} />
        <PrimaryButton label="Save & Continue" icon="arrow-forward" onPress={() => {
          saveDraft().catch(() => undefined);
          router.push('/cv-languages');
        }} />
      </View>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  saveText: {
    color: c.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStep: {
    color: c.textPrimary,
    fontSize: 13,
    opacity: 0.8,
    fontWeight: '500',
  },
  progressPercent: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: c.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '60%',
    backgroundColor: c.primary,
    borderRadius: 999,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 200,
    paddingTop: 12,
  },
  hero: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: c.textSecondary,
    lineHeight: 20,
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
    borderColor: c.border,
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
  fieldGroup: {
    marginBottom: 16,
  },
  fieldGroupHalf: {
    flex: 1,
    gap: 8,
  },
  label: {
    color: c.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    color: c.textPrimary,
    paddingHorizontal: 16,
    paddingRight: 44,
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateInput: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  dateInputDisabled: {
    opacity: 0.5,
  },
  dateText: {
    color: c.textPrimary,
    fontSize: 14,
  },
  placeholderText: {
    color: c.textSecondary,
  },
  pickerWrap: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  checkboxLabel: {
    color: c.textPrimary,
    fontSize: 15,
    fontWeight: '600',
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
    gap: 12,
  },
});
