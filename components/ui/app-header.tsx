import { MaterialIcons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/contexts/ThemeContext';
import { theme } from '@/constants/globalready-theme';

type AppHeaderProps = {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  backIcon?: keyof typeof MaterialIcons.glyphMap;
  compact?: boolean;
  containerStyle?: ViewStyle;
};

export function AppHeader({
  title,
  onBack,
  right,
  backIcon = 'arrow-back',
  compact = false,
  containerStyle,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        styles.header,
        { paddingTop: Math.max(insets.top, theme.spacing.sm) },
        compact && styles.headerCompact,
        containerStyle,
      ]}
    >
      {onBack ? (
        <TouchableOpacity style={styles.iconButton} onPress={onBack} accessibilityRole="button">
          <MaterialIcons name={backIcon} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconSpacer} />
      )}
      <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.rightSlot}>{right ?? <View style={styles.iconSpacer} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerCompact: {
    paddingBottom: theme.spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacer: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  rightSlot: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
