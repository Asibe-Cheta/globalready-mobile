import { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/contexts/ThemeContext';
import { theme } from '@/constants/globalready-theme';

type ScreenProps = {
  children: ReactNode;
  padded?: boolean;
};

export function Screen({ children, padded = false }: ScreenProps) {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <View style={[{ flex: 1, backgroundColor: colors.background }, padded && { paddingHorizontal: theme.spacing.lg }]}>
        {children}
      </View>
    </SafeAreaView>
  );
}
