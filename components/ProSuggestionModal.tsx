import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '@/contexts/ThemeContext';
import { PrimaryButton } from '@/components/ui/primary-button';
import { theme } from '@/constants/globalready-theme';

interface ProSuggestionModalProps {
  visible: boolean;
  message: string;
  onSeePro: () => void;
  onDismiss: () => void;
}

export function ProSuggestionModal({
  visible,
  message,
  onSeePro,
  onDismiss,
}: ProSuggestionModalProps) {
  const { colors } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
            <MaterialIcons name="auto-awesome" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.message, { color: colors.textPrimary }]}>{message}</Text>
          <PrimaryButton
            label="See what's in Pro"
            onPress={() => {
              onDismiss();
              onSeePro();
            }}
            style={styles.primaryBtn}
          />
          <TouchableOpacity onPress={onDismiss} style={styles.laterBtn} accessibilityRole="button">
            <Text style={[styles.laterText, { color: colors.textSecondary }]}>Maybe later</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  primaryBtn: {
    width: '100%',
    marginBottom: theme.spacing.sm,
  },
  laterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  laterText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
