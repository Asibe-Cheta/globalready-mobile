import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useCVBuilder } from '@/hooks/useCVBuilder';

/* ─── Soft skill presets ─── */
const softSkillSuggestions = [
  'Physically fit',
  'Reliable',
  'Team worker',
  'Shift-ready',
  'Quick learner',
];

/* ─── Technical fields & skill suggestions per field ─── */
const technicalFields: { id: string; label: string; icon: string }[] = [
  { id: 'software', label: 'Software Eng', icon: 'code' },
  { id: 'engineering', label: 'Engineering', icon: 'engineering' },
  { id: 'uiux', label: 'UI/UX Design', icon: 'design-services' },
  { id: 'data', label: 'Data Science', icon: 'analytics' },
  { id: 'cyber', label: 'Cybersecurity', icon: 'security' },
  { id: 'pm', label: 'Project Mgmt', icon: 'assignment' },
  { id: 'devops', label: 'DevOps & Cloud', icon: 'cloud' },
  { id: 'marketing', label: 'Marketing', icon: 'campaign' },
  { id: 'healthcare', label: 'Healthcare', icon: 'medical-services' },
  { id: 'finance', label: 'Finance', icon: 'account-balance' },
];

const technicalSkillsByField: Record<string, string[]> = {
  software: ['JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'REST APIs', 'Docker', 'AWS'],
  engineering: ['AutoCAD', 'MATLAB', 'SolidWorks', 'PLC Programming', 'Lean Manufacturing', 'Six Sigma', 'CAD/CAM', 'Process Optimization', 'Quality Control', 'Technical Drawing'],
  uiux: ['Figma', 'Adobe XD', 'Sketch', 'Wireframing', 'Prototyping', 'User Research', 'Design Systems', 'Responsive Design', 'Accessibility (WCAG)', 'Interaction Design'],
  data: ['Python', 'R', 'SQL', 'Tableau', 'Power BI', 'Machine Learning', 'Statistical Analysis', 'Data Visualization', 'Pandas', 'TensorFlow'],
  cyber: ['Network Security', 'Penetration Testing', 'SIEM', 'Incident Response', 'Firewall Management', 'Vulnerability Assessment', 'ISO 27001', 'Encryption', 'SOC Operations', 'Risk Assessment'],
  pm: ['Agile/Scrum', 'Jira', 'MS Project', 'Risk Management', 'Stakeholder Management', 'Budgeting', 'Gantt Charts', 'PMP', 'Sprint Planning', 'Resource Allocation'],
  devops: ['AWS', 'Azure', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux', 'Jenkins', 'Monitoring', 'Infrastructure as Code'],
  marketing: ['Google Analytics', 'SEO', 'SEM', 'Social Media Ads', 'Content Strategy', 'Email Marketing', 'A/B Testing', 'HubSpot', 'Copywriting', 'PPC'],
  healthcare: ['Electronic Health Records', 'HIPAA Compliance', 'Clinical Research', 'Patient Care', 'Medical Terminology', 'Pharmacology', 'CPR/BLS', 'Lab Techniques', 'Infection Control', 'Care Planning'],
  finance: ['Financial Modeling', 'Excel (Advanced)', 'Bloomberg Terminal', 'GAAP/IFRS', 'Risk Analysis', 'SAP', 'Forecasting', 'Auditing', 'Tax Preparation', 'QuickBooks'],
};

const allTechSuggestions = new Set(Object.values(technicalSkillsByField).flat());

const MAX_SKILLS = 15;

export default function CvSkillsAvailabilityScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { cvData, updateSkills, updatePersonal, saveDraft, setCurrentStep } = useCVBuilder();
  const hasSyncedRef = useRef(false);

  /* ─── Derive initial state from existing cvData ─── */
  const initialState = useMemo(() => {
    const existing = cvData.skills || [];
    const soft: Record<string, boolean> = {};
    softSkillSuggestions.forEach((s) => { soft[s] = false; });
    const tech: Record<string, boolean> = {};
    const custom: string[] = [];

    for (const skill of existing) {
      if (softSkillSuggestions.includes(skill)) {
        soft[skill] = true;
      } else if (allTechSuggestions.has(skill)) {
        tech[skill] = true;
      } else {
        custom.push(skill);
      }
    }

    return { soft, tech, custom };
  }, [cvData.skills]);

  const [selectedSoftSkills, setSelectedSoftSkills] = useState(initialState.soft);
  const [selectedTechSkills, setSelectedTechSkills] = useState<Record<string, boolean>>(initialState.tech);
  const [customSkills, setCustomSkills] = useState<string[]>(initialState.custom);
  const [customTechSkills, setCustomTechSkills] = useState<string[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(
    (cvData.personal?.technicalField as string) || null
  );
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTechInput, setCustomTechInput] = useState('');
  const [showCustomTechInput, setShowCustomTechInput] = useState(false);
  /* ─── Sync from cvData on first load ─── */
  useEffect(() => {
    if (hasSyncedRef.current) return;
    if ((cvData.skills || []).length > 0) {
      setSelectedSoftSkills(initialState.soft);
      setSelectedTechSkills(initialState.tech);
      setCustomSkills(initialState.custom);
      if (cvData.personal?.technicalField) {
        setSelectedField(cvData.personal.technicalField as string);
      }
      hasSyncedRef.current = true;
    }
  }, [cvData.skills, initialState, cvData.personal?.technicalField]);

  /* ─── Compute combined skills list ─── */
  const allSelectedSkills = useMemo(() => {
    const soft = Object.entries(selectedSoftSkills).filter(([, v]) => v).map(([k]) => k);
    const tech = Object.entries(selectedTechSkills).filter(([, v]) => v).map(([k]) => k);
    return [...soft, ...tech, ...customSkills, ...customTechSkills];
  }, [selectedSoftSkills, selectedTechSkills, customSkills, customTechSkills]);

  const totalCount = allSelectedSkills.length;
  const fieldSuggestions = selectedField ? (technicalSkillsByField[selectedField] || []) : [];

  /* ─── Handlers ─── */
  const toggleSoftSkill = (label: string) => {
    if (!selectedSoftSkills[label] && totalCount >= MAX_SKILLS) return;
    setSelectedSoftSkills((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const toggleTechSkill = (label: string) => {
    const current = selectedTechSkills[label] ?? false;
    if (!current && totalCount >= MAX_SKILLS) return;
    setSelectedTechSkills((prev) => ({ ...prev, [label]: !current }));
  };

  const handleAddCustomSkill = () => {
    const trimmed = customInput.trim();
    if (!trimmed || totalCount >= MAX_SKILLS) return;
    if (allSelectedSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setCustomInput('');
      setShowCustomInput(false);
      return;
    }
    setCustomSkills((prev) => [...prev, trimmed]);
    setCustomInput('');
    setShowCustomInput(false);
  };

  const handleRemoveCustomSkill = (skill: string) => {
    setCustomSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleAddCustomTechSkill = () => {
    const trimmed = customTechInput.trim();
    if (!trimmed || totalCount >= MAX_SKILLS) return;
    if (allSelectedSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setCustomTechInput('');
      setShowCustomTechInput(false);
      return;
    }
    setCustomTechSkills((prev) => [...prev, trimmed]);
    setCustomTechInput('');
    setShowCustomTechInput(false);
  };

  const handleRemoveCustomTechSkill = (skill: string) => {
    setCustomTechSkills((prev) => prev.filter((s) => s !== skill));
  };

  /* ─── Persist to cvData ─── */
  useEffect(() => {
    const skillsChanged =
      allSelectedSkills.length !== (cvData.skills || []).length ||
      allSelectedSkills.some((s) => !(cvData.skills || []).includes(s));

    if (skillsChanged) {
      updateSkills(allSelectedSkills);
    }

    const personalUpdates: Record<string, any> = {};
    if (cvData.personal?.technicalField !== selectedField) {
      personalUpdates.technicalField = selectedField;
    }
    if (Object.keys(personalUpdates).length) {
      updatePersonal(personalUpdates);
    }

    setCurrentStep(2);
    saveDraft().catch(() => undefined);
  }, [allSelectedSkills, selectedField, cvData.skills, cvData.personal?.technicalField, updateSkills, updatePersonal, saveDraft, setCurrentStep]);

  const selectedFieldCount = fieldSuggestions.filter((s) => selectedTechSkills[s]).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={router.back} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Skills</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/landing')} accessibilityRole="button">
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>CV Builder</Text>
            <Text style={styles.progressStep}>Step 2 of 5</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── Soft Skills ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Soft Skills</Text>
            <Text style={styles.sectionSubtitle}>Select your interpersonal strengths.</Text>
            <View style={styles.chipWrap}>
              {softSkillSuggestions.map((label) => {
                const isSelected = selectedSoftSkills[label];
                return (
                  <Pressable
                    key={label}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleSoftSkill(label)}
                  >
                    {isSelected && <MaterialIcons name="check" size={16} color="#fff" style={styles.chipIcon} />}
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{label}</Text>
                  </Pressable>
                );
              })}
              {customSkills.map((skill) => (
                <View key={skill} style={[styles.chip, styles.customChip]}>
                  <Text style={styles.chipTextSelected}>{skill}</Text>
                  <TouchableOpacity
                    style={styles.removeChip}
                    onPress={() => handleRemoveCustomSkill(skill)}
                    accessibilityRole="button"
                  >
                    <MaterialIcons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addChip}
                accessibilityRole="button"
                onPress={() => setShowCustomInput((prev) => !prev)}
                disabled={totalCount >= MAX_SKILLS}
              >
                <MaterialIcons name="add" size={16} color={colors.primary} />
                <Text style={styles.addChipText}>Add Skill</Text>
              </TouchableOpacity>
              {showCustomInput ? (
                <View style={styles.customInputWrap}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="Type a skill"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={customInput}
                    onChangeText={setCustomInput}
                    onSubmitEditing={handleAddCustomSkill}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={styles.customAddButton}
                    onPress={handleAddCustomSkill}
                    accessibilityRole="button"
                  >
                    <MaterialIcons name="check" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />

          {/* ── Technical Skills ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            <Text style={styles.sectionSubtitle}>Select your field to see relevant skills.</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fieldScrollContent}
              style={styles.fieldScroll}
            >
              {technicalFields.map((field) => {
                const isActive = selectedField === field.id;
                return (
                  <TouchableOpacity
                    key={field.id}
                    style={[styles.fieldChip, isActive && styles.fieldChipActive]}
                    onPress={() => setSelectedField(isActive ? null : field.id)}
                    accessibilityRole="button"
                  >
                    <MaterialIcons
                      name={field.icon as any}
                      size={16}
                      color={isActive ? '#fff' : colors.textSecondary}
                    />
                    <Text style={[styles.fieldChipText, isActive && styles.fieldChipTextActive]}>
                      {field.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedField && fieldSuggestions.length > 0 ? (
              <View style={styles.techSuggestionsWrap}>
                <Text style={styles.techSuggestionsLabel}>
                  {technicalFields.find((f) => f.id === selectedField)?.label} Skills
                  {selectedFieldCount > 0 ? ` (${selectedFieldCount} selected)` : ''}
                </Text>
                <View style={styles.chipWrap}>
                  {fieldSuggestions.map((skill) => {
                    const isSelected = selectedTechSkills[skill] ?? false;
                    return (
                      <Pressable
                        key={skill}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => toggleTechSkill(skill)}
                      >
                        {isSelected && <MaterialIcons name="check" size={16} color="#fff" style={styles.chipIcon} />}
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{skill}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {!selectedField ? (
              <View style={styles.emptyFieldPrompt}>
                <MaterialIcons name="touch-app" size={24} color={colors.textSecondary} />
                <Text style={styles.emptyFieldText}>
                  Tap a field above to see suggested technical skills
                </Text>
              </View>
            ) : null}

            <View style={styles.techCustomSection}>
              <Text style={styles.techCustomLabel}>Or add your own technical skills</Text>
              <View style={styles.chipWrap}>
                {customTechSkills.map((skill) => (
                  <View key={skill} style={[styles.chip, styles.customChip]}>
                    <Text style={styles.chipTextSelected}>{skill}</Text>
                    <Pressable
                      style={styles.removeChip}
                      onPress={() => handleRemoveCustomTechSkill(skill)}
                      accessibilityRole="button"
                    >
                      <MaterialIcons name="close" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
                {!showCustomTechInput && totalCount < MAX_SKILLS ? (
                  <Pressable
                    style={styles.addChip}
                    onPress={() => setShowCustomTechInput(true)}
                    accessibilityRole="button"
                  >
                    <MaterialIcons name="add" size={18} color={colors.primary} />
                    <Text style={styles.addChipText}>Add technical skill</Text>
                  </Pressable>
                ) : null}
              </View>
              {showCustomTechInput ? (
                <View style={styles.customInputRow}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="e.g. Python, AWS, React"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={customTechInput}
                    onChangeText={setCustomTechInput}
                    onSubmitEditing={handleAddCustomTechSkill}
                    returnKeyType="done"
                    autoFocus
                  />
                  <Pressable
                    style={[styles.customInputBtn, customTechInput.trim() && styles.customInputBtnActive]}
                    onPress={handleAddCustomTechSkill}
                  >
                    <Text style={[styles.customInputBtnText, customTechInput.trim() ? styles.customInputBtnTextActive : null]}>Add</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>

          {totalCount > 0 ? (
            <Text style={styles.skillCount}>
              {totalCount} / {MAX_SKILLS} skills selected
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.bottomBar}>
          <PrimaryButton label="Next Step" icon="arrow-forward" onPress={() => router.push('/cv-work-experience')} />
          <Text style={styles.bottomNote}>You can update this later in your profile.</Text>
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
  progressWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  progressLabel: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressStep: {
    color: c.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: c.border,
    overflow: 'hidden',
  },
  progressFill: {
    width: '40%',
    height: '100%',
    backgroundColor: c.primary,
    borderRadius: 999,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 180,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: c.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: c.textSecondary,
    fontSize: 13,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(148,163,184,0.2)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  customChip: {
    backgroundColor: c.primary,
  },
  chipSelected: {
    backgroundColor: c.primary,
    shadowColor: c.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    color: c.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
  removeChip: {
    marginLeft: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(148,163,184,0.4)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addChipText: {
    color: c.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  customInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInput: {
    minWidth: 160,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    paddingHorizontal: 12,
    color: c.textPrimary,
    backgroundColor: c.surface,
  },
  customAddButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  customInputBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customInputBtnActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  customInputBtnText: {
    color: c.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  customInputBtnTextActive: {
    color: '#fff',
  },
  techCustomSection: {
    marginTop: 16,
    gap: 8,
  },
  techCustomLabel: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.2)',
    marginVertical: 20,
  },
  /* ── Technical field selector ── */
  fieldScroll: {
    marginTop: 4,
  },
  fieldScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  fieldChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  fieldChipActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  fieldChipText: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  fieldChipTextActive: {
    color: '#fff',
  },
  techSuggestionsWrap: {
    marginTop: 12,
    gap: 8,
  },
  techSuggestionsLabel: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyFieldPrompt: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(148,163,184,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
  },
  emptyFieldText: {
    flex: 1,
    color: c.textSecondary,
    fontSize: 13,
  },
  skillCount: {
    textAlign: 'center',
    color: c.textSecondary,
    fontSize: 12,
    marginTop: 16,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
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
