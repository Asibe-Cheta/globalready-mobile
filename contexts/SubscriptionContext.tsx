import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';
import { getSubscription, isProActive, Subscription } from '@/services/supabase/subscription';

interface SubscriptionContextType {
  isPro: boolean;
  subscription: Subscription | null;
  loading: boolean;
  refresh: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPro: false,
  subscription: null,
  loading: true,
  refresh: () => {},
});

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSubscription(null);
        return;
      }
      const sub = await getSubscription(user.id);
      setSubscription(sub);
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    // Refresh subscription status when app comes to foreground
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });

    return () => subscription.remove();
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        isPro: isProActive(subscription),
        subscription,
        loading,
        refresh: load,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);
