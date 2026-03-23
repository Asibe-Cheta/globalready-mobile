import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { PrimaryButton } from './ui/primary-button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  showIcon?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  showIcon = true,
}) => {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.container}>
      {showIcon && <Text style={styles.icon}>⚠️</Text>}
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <PrimaryButton
          label="Try Again"
          onPress={onRetry}
          style={styles.retryButton}
        />
      )}
    </View>
  );
};

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.background,
      padding: 30,
    },
    icon: {
      fontSize: 60,
      marginBottom: 20,
    },
    message: {
      fontSize: 16,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 20,
    },
    retryButton: {
      marginTop: 10,
    },
  });
