import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'large',
}) => {
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 20 }}>
      <ActivityIndicator size={size} color={colors.primary} />
      <Text style={{ marginTop: 15, fontSize: 16, color: colors.textSecondary, textAlign: 'center' }}>{message}</Text>
    </View>
  );
};
