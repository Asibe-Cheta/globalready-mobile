import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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

const proficiencyOptions = ['Native', 'Advanced', 'Intermediate', 'Beginner'];

const COMMON_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian',
  'Dutch', 'Russian', 'Chinese (Mandarin)', 'Chinese (Cantonese)',
  'Japanese', 'Korean', 'Arabic', 'Hindi', 'Urdu', 'Turkish',
  'Polish', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Greek',
  'Czech', 'Romanian', 'Hungarian', 'Thai', 'Vietnamese', 'Indonesian',
  'Malay', 'Tagalog', 'Swahili', 'Yoruba', 'Igbo', 'Hausa', 'Zulu',
  'Amharic', 'Hebrew', 'Persian (Farsi)', 'Ukrainian', 'Bengali',
];

type LanguageCard = {
  id: string;
  label: string;
  proficiency: string;
};

let nextId = 3;

export default function CvLanguagesScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const [languageCards, setLanguageCards] = useState<LanguageCard[]>([
    { id: 'lang-1', label: 'English', proficiency: 'Native' },
    { id: 'lang-2', label: '', proficiency: 'Intermediate' },
  ]);
  const [saving, setSaving] = useState(false);
  const [pickerCardId, setPickerCardId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { cvData, updateLanguage, addLanguage, saveToDatabase } = useCVBuilder();

  const filteredLanguages = search.trim()
    ? COMMON_LANGUAGES.filter((lang) =>
        lang.toLowerCase().includes(search.toLowerCase())
      )
    : COMMON_LANGUAGES;

  const selectLanguage = useCallback((language: string) => {
    setLanguageCards((prev) =>
      prev.map((card) =>
        card.id === pickerCardId ? { ...card, label: language } : card
      )
    );
    setPickerCardId(null);
    setSearch('');
  }, [pickerCardId]);

  const updateProficiency = (id: string, proficiency: string) => {
    setLanguageCards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, proficiency } : card))
    );
  };

  const deleteCard = (id: string) => {
    setLanguageCards((prev) => prev.filter((card) => card.id !== id));
  };

  const addCard = () => {
    const id = `lang-${nextId++}`;
    setLanguageCards((prev) => [
      ...prev,
      { id, label: '', proficiency: 'Intermediate' },
    ]);
  };

  const handleNext = async () => {
    try {
      setSaving(true);
      const validCards = languageCards.filter((c) => c.label.trim());
      const languages = validCards.map((card) => ({
        language: card.label,
        proficiency: card.proficiency,
      }));

      if (!cvData.languages?.length) {
        languages.forEach((lang) => addLanguage(lang));
      } else {
        languages.forEach((lang, index) => updateLanguage(index, lang));
      }

      await saveDraft();
      router.push('/cv-professional-summary');
    } catch {
      router.push('/cv-professional-summary');
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
          <Text style={styles.headerTitle}>Languages</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/landing')}
            accessibilityRole="button"
          >
            <MaterialIcons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.stepDots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dotActive} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.title}>What languages do you speak?</Text>
            <Text style={styles.subtitle}>
              Adding languages increases your global opportunities for travel and work.
            </Text>
          </View>

          {languageCards.map((card) => (
            <View key={card.id} style={styles.card}>
              {languageCards.length > 1 && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteCard(card.id)}
                  accessibilityRole="button"
                >
                  <MaterialIcons name="delete" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Language</Text>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => {
                    setPickerCardId(card.id);
                    setSearch('');
                  }}
                  accessibilityRole="button"
                >
                  <Text style={[styles.selectText, card.label && styles.selectTextFilled]}>
                    {card.label || 'Select a language (e.g. Spanish)'}
                  </Text>
                  <MaterialIcons name="expand-more" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Proficiency Level</Text>
                <View style={styles.chipWrap}>
                  {proficiencyOptions.map((option) => {
                    const isSelected = option === card.proficiency;
                    return (
                      <TouchableOpacity
                        key={`${card.id}-${option}`}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => updateProficiency(card.id, option)}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addCard} accessibilityRole="button">
            <MaterialIcons name="add-circle" size={18} color={colors.primary} />
            <Text style={styles.addButtonText}>Add Another Language</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.bottomBar}>
          <PrimaryButton
            label={saving ? 'Saving...' : 'Next Step'}
            icon={saving ? undefined : 'arrow-forward'}
            onPress={handleNext}
            disabled={saving}
          />
        </View>
      </View>

      <Modal visible={pickerCardId !== null} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity
                onPress={() => { setPickerCardId(null); setSearch(''); }}
                accessibilityRole="button"
              >
                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
              <MaterialIcons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search or type a language..."
                placeholderTextColor={colors.inputPlaceholder}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
            </View>

            {search.trim() &&
              !COMMON_LANGUAGES.some(
                (l) => l.toLowerCase() === search.trim().toLowerCase()
              ) && (
              <TouchableOpacity
                style={styles.customRow}
                onPress={() => selectLanguage(search.trim())}
                accessibilityRole="button"
              >
                <MaterialIcons name="add" size={20} color={colors.primary} />
                <Text style={styles.customRowText}>
                  Add &quot;{search.trim()}&quot;
                </Text>
              </TouchableOpacity>
            )}

            <FlatList
              data={filteredLanguages}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.langRow}
                  onPress={() => selectLanguage(item)}
                  accessibilityRole="button"
                >
                  <Text style={styles.langRowText}>{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.langSep} />}
            />
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
  stepDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(148,163,184,0.5)',
  },
  dotActive: {
    width: 28,
    height: 6,
    borderRadius: 3,
    backgroundColor: c.primary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 160,
  },
  hero: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    color: c.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginBottom: 12,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  selectInput: {
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.background,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    color: c.textSecondary,
    fontSize: 13,
  },
  selectTextFilled: {
    color: c.textPrimary,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    backgroundColor: c.background,
  },
  chipSelected: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  chipText: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(148,163,184,0.4)',
    borderRadius: 999,
    paddingVertical: 12,
    justifyContent: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: c.primary,
    fontSize: 14,
    fontWeight: '700',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: c.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: {
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  searchInput: {
    flex: 1,
    color: c.textPrimary,
    fontSize: 14,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(13,108,242,0.08)',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  customRowText: {
    color: c.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  langRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  langRowText: {
    color: c.textPrimary,
    fontSize: 15,
  },
  langSep: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: 16,
  },
});
