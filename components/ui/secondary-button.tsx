import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { theme } from '@/constants/globalready-theme';

type SecondaryButtonProps = {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
  style?: ViewStyle;
};

export function SecondaryButton({ label, icon, onPress, style }: SecondaryButtonProps) {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress} accessibilityRole="button">
      {icon ? <MaterialIcons name={icon} size={18} color={colors.primary} /> : null}
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    button: {
      height: 52,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    text: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
  });
