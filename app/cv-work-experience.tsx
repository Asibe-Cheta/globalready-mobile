import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
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
import { generateWorkExperienceBullets } from '@/services/ai/workExperience';
const quickPhrases = ['Led a team', 'Handled cash', 'Solved problems', 'Customer support'];

export default function CvWorkExperienceScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tasks, setTasks] = useState('');
  const [currentJob, setCurrentJob] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [experienceIndex, setExperienceIndex] = useState<number | null>(null);
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { cvData, addExperience, updateExperience, removeExperience, saveDraft, setCurrentStep } = useCVBuilder();

  const lastSavedRef = useRef<string>('');

  const formatDate = (value: Date | null) => {
    if (!value) return 'mm/dd/yyyy';
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    const yyyy = value.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const handleAiAssist = async () => {
    if (!jobTitle.trim()) {
      Alert.alert('Add a job title', 'Enter a job title so AI Assist can tailor the bullets.');
      return;
    }

    try {
      setAiLoading(true);
      const { bullets } = await generateWorkExperienceBullets({
        jobTitle: jobTitle.trim(),
        company: company.trim() || undefined,
        years: startDate ? String(startDate.getFullYear()) : undefined,
        existing: tasks.trim() || undefined,
      });

      if (!bullets?.length) {
        Alert.alert('No suggestions yet', 'Try again or add a few details.');
        return;
      }

      const formatted = bullets.map((bullet) => `• ${bullet}`).join('\n');
      setTasks(formatted);
    } catch (error) {
      console.error('AI Assist error:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to reach the AI service. Please try again in a moment.';
      Alert.alert('AI Assist failed', message);
    } finally {
      setAiLoading(false);
    }
  };

  const appendPhrase = (phrase: string) => {
    const line = `• ${phrase}`;
    if (!tasks.trim()) {
      setTasks(line);
      return;
    }
    if (tasks.includes(line)) return;
    setTasks((prev) => `${prev}\n${line}`.trim());
  };

  // Load last existing experience entry for editing on mount
  useEffect(() => {
    if (experienceIndex !== null) return;
    const lastIdx = (cvData.experience?.length ?? 0) - 1;
    if (lastIdx < 0) return;
    const entry = cvData.experience[lastIdx];
    if (!entry) return;
    setJobTitle(entry.title || '');
    setCompany(entry.company || '');
    setStartDate(entry.startDate ? new Date(entry.startDate) : null);
    setEndDate(entry.endDate ? new Date(entry.endDate) : null);
    setCurrentJob(Boolean(entry.current));
    if (entry.achievements?.length) {
      setTasks(entry.achievements.map((item: string) => `• ${item}`).join('\n'));
    }
    setExperienceIndex(lastIdx);
    lastSavedRef.current = JSON.stringify(entry);
  }, []); // run once on mount

  const clearForm = () => {
    setJobTitle('');
    setCompany('');
    setStartDate(null);
    setEndDate(null);
    setTasks('');
    setCurrentJob(false);
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const handleDeleteExperience = (idx: number) => {
    Alert.alert('Delete experience?', 'This will remove this position from your CV.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeExperience(idx);
          // If we were editing this entry, clear the form
          if (experienceIndex === idx) {
            clearForm();
            setExperienceIndex(null);
            lastSavedRef.current = '';
          } else if (experienceIndex !== null && idx < experienceIndex) {
            // Shift index down if a prior entry was deleted
            setExperienceIndex(experienceIndex - 1);
          }
          saveDraft().catch(() => undefined);
        },
      },
    ]);
  };

  const handleAddAnother = () => {
    if (!hasAnyInput) return;
    // Current entry is already saved via auto-save effect
    clearForm();
    const nextIndex = cvData.experience?.length ?? 0;
    setExperienceIndex(null);
    lastSavedRef.current = '';
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  useEffect(() => {
    if (currentJob && endDate) {
      setEndDate(null);
    }
  }, [currentJob, endDate]);

  const achievements = useMemo(
    () =>
      tasks
        .split('\n')
        .map((line) => line.replace(/^•\s*/, '').trim())
        .filter(Boolean),
    [tasks]
  );

  const payload = useMemo(
    () => ({
      title: jobTitle.trim(),
      company: company.trim(),
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: currentJob ? undefined : endDate ? endDate.toISOString() : undefined,
      current: currentJob,
      achievements,
    }),
    [jobTitle, company, startDate, endDate, currentJob, achievements]
  );

  const hasAnyInput = Boolean(
    payload.title ||
      payload.company ||
      payload.startDate ||
      payload.endDate ||
      payload.current ||
      payload.achievements.length
  );

  useEffect(() => {
    const serialized = JSON.stringify(payload);
    if (serialized === lastSavedRef.current) return;
    if (!hasAnyInput) return;

    if (experienceIndex === null) {
      addExperience(payload);
      const newIdx = cvData.experience?.length ?? 0;
      setExperienceIndex(newIdx);
    } else {
      updateExperience(experienceIndex, payload);
    }

    lastSavedRef.current = serialized;
    setCurrentStep(3);
    saveDraft().catch(() => undefined);
  }, [
    payload,
    hasAnyInput,
    experienceIndex,
    addExperience,
    updateExperience,
    setCurrentStep,
    saveDraft,
    cvData.experience,
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CV Builder</Text>
          <View style={styles.headerActions}>
            <Text style={styles.headerStep}>Step 2/4</Text>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/landing')}
              accessibilityRole="button"
            >
              <MaterialIcons name="home" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Add Work Experience</Text>
          <Text style={styles.subtitle}>Tell us about your most recent or relevant role.</Text>

          {cvData.experience?.length > 0 ? (
            <View style={styles.entryList}>
              {cvData.experience.map((exp: any, idx: number) => (
                idx !== experienceIndex ? (
                  <View key={idx} style={styles.entryCard}>
                    <TouchableOpacity
                      style={styles.entryInfo}
                      onPress={() => {
                        setExperienceIndex(idx);
                        setJobTitle(exp.title || '');
                        setCompany(exp.company || '');
                        setStartDate(exp.startDate ? new Date(exp.startDate) : null);
                        setEndDate(exp.endDate ? new Date(exp.endDate) : null);
                        setCurrentJob(Boolean(exp.current));
                        setTasks(exp.achievements?.length ? exp.achievements.map((a: string) => `• ${a}`).join('\n') : '');
                        lastSavedRef.current = JSON.stringify(exp);
                      }}
                      accessibilityRole="button"
                    >
                      <Text style={styles.entryTitle}>{exp.title || 'Untitled'}</Text>
                      <Text style={styles.entrySubtitle}>{exp.company || ''}</Text>
                    </TouchableOpacity>
                    <View style={styles.entryActions}>
                      <TouchableOpacity
                        style={styles.entryActionBtn}
                        onPress={() => {
                          setExperienceIndex(idx);
                          setJobTitle(exp.title || '');
                          setCompany(exp.company || '');
                          setStartDate(exp.startDate ? new Date(exp.startDate) : null);
                          setEndDate(exp.endDate ? new Date(exp.endDate) : null);
                          setCurrentJob(Boolean(exp.current));
                          setTasks(exp.achievements?.length ? exp.achievements.map((a: string) => `• ${a}`).join('\n') : '');
                          lastSavedRef.current = JSON.stringify(exp);
                        }}
                        accessibilityRole="button"
                      >
                        <MaterialIcons name="edit" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.entryActionBtn}
                        onPress={() => handleDeleteExperience(idx)}
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
            <MaterialIcons name="visibility" size={20} color={colors.primary} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Pro Tip</Text>
              <Text style={styles.tipText}>
                We focus on what employers actually scan for. Keep it punchy and outcome-focused.
              </Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Job Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Barista, Junior Developer"
              placeholderTextColor={colors.inputPlaceholder}
              value={jobTitle}
              onChangeText={setJobTitle}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Company / Organization</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Starbucks, Tech Corp"
              placeholderTextColor={colors.inputPlaceholder}
              value={company}
              onChangeText={setCompany}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>Start Date</Text>
              <Pressable
                style={styles.input}
                onPress={() => setShowStartPicker(true)}
                accessibilityRole="button"
              >
                <Text style={styles.inputText}>
                  {formatDate(startDate)}
                </Text>
              </Pressable>
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>End Date</Text>
              <Pressable
                style={[styles.input, currentJob && styles.inputDisabled]}
                onPress={() => {
                  if (!currentJob) {
                    setShowEndPicker(true);
                  }
                }}
                accessibilityRole="button"
              >
                <Text style={styles.inputText}>
                  {currentJob ? 'Present' : formatDate(endDate)}
                </Text>
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
                disabled={currentJob}
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

          <Pressable style={styles.toggleRow} onPress={() => setCurrentJob(!currentJob)}>
            <View style={[styles.toggleTrack, currentJob && styles.toggleTrackActive]}>
              <View style={[styles.toggleThumb, currentJob && styles.toggleThumbActive]} />
            </View>
            <Text style={styles.toggleLabel}>I currently work here</Text>
          </Pressable>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Daily Tasks & Achievements</Text>
              <TouchableOpacity
                onPress={handleAiAssist}
                accessibilityRole="button"
                disabled={aiLoading}
              >
                <Text style={[styles.aiAssist, aiLoading && styles.aiAssistDisabled]}>
                  {aiLoading ? 'Generating...' : 'AI Assist ✨'}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textarea}
              placeholder={'• Managed daily operations\n• Improved customer satisfaction by 20%\n• Led a team of 4 people'}
              placeholderTextColor={colors.inputPlaceholder}
              multiline
              textAlignVertical="top"
              value={tasks}
              onChangeText={setTasks}
            />
          </View>

          <View style={styles.phrases}>
            <Text style={styles.phrasesTitle}>Tap to add phrases</Text>
            <View style={styles.phraseList}>
              {quickPhrases.map((phrase) => (
                <TouchableOpacity
                  key={phrase}
                  style={styles.phraseChip}
                  onPress={() => appendPhrase(phrase)}
                  accessibilityRole="button"
                >
                  <MaterialIcons name="add" size={16} color={colors.textSecondary} />
                  <Text style={styles.phraseText}>{phrase}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <SecondaryButton label="Add Another Position" icon="add-circle" onPress={handleAddAnother} />
          <PrimaryButton label="Save & Continue" icon="arrow-forward" onPress={() => {
            saveDraft().catch(() => undefined);
            router.push('/cv-education');
          }} />
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
    fontSize: 18,
    fontWeight: '700',
  },
  headerStep: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: c.border,
    overflow: 'hidden',
  },
  progressFill: {
    width: '50%',
    height: '100%',
    backgroundColor: c.primary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 200,
  },
  title: {
    color: c.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  tipCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(148,163,184,0.2)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    marginBottom: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: c.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 4,
  },
  tipText: {
    color: c.textSecondary,
    fontSize: 12,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    color: c.textPrimary,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  inputText: {
    color: c.textPrimary,
    fontSize: 14,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 999,
    backgroundColor: c.border,
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
  },
  toggleThumbActive: {
    transform: [{ translateX: 18 }],
  },
  toggleLabel: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  aiAssist: {
    color: c.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  aiAssistDisabled: {
    opacity: 0.6,
  },
  textarea: {
    minHeight: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    color: c.textPrimary,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  phrases: {
    marginTop: 10,
  },
  phrasesTitle: {
    color: c.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  phraseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  phraseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  phraseText: {
    color: c.textPrimary,
    fontSize: 12,
  },
  pickerWrap: {
    marginTop: 8,
    borderRadius: 12,
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
});
