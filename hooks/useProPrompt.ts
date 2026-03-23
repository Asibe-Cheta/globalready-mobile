import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';

const PREFIX = 'gr_pro_prompt_';
const COOLDOWN_DAYS = 7;

export function useProPrompt() {
  const shouldShowProPrompt = useCallback(async (key: string): Promise<boolean> => {
    try {
      const stored = await AsyncStorage.getItem(PREFIX + key);
      if (!stored) return true;
      const timestamp = parseInt(stored, 10);
      if (isNaN(timestamp)) return true;
      const daysSince = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
      return daysSince >= COOLDOWN_DAYS;
    } catch {
      return true;
    }
  }, []);

  const markProPromptShown = useCallback(async (key: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(PREFIX + key, String(Date.now()));
    } catch {
      // ignore
    }
  }, []);

  return { shouldShowProPrompt, markProPromptShown };
}
