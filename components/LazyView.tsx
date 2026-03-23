import React, { useState, useEffect, ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';

interface LazyViewProps {
  children: ReactNode;
  delay?: number;
}

export const LazyView: React.FC<LazyViewProps> = ({ children, delay = 100 }) => {
  const { colors } = useAppTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsReady(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  if (!isReady) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
