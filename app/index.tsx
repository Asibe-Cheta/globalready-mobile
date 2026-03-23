import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, ImageBackground, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { theme } from '@/constants/globalready-theme';
import { useAppTheme, type AppColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

const LOGO = require('@/assets/logo/global-logo.png');
const MAP_IMAGE = 'https://placeholder.pics/svg/600/300/101722-2A3B55/map';

const slides = [
  {
    title: 'GlobalReady',
    subtitle: 'Master one goal. Build your future.',
    highlight: 'Study. Work. Grow.',
    caption: 'Your clear path to life abroad starts here.',
  },
  {
    title: 'AI-Powered CVs',
    subtitle: 'Get a perfectly optimized CV tailored to each job you apply for.',
    highlight: 'Stand out. Get hired.',
    caption: 'Smart CV tailoring powered by AI.',
  },
  {
    title: 'Learn & Grow',
    subtitle: 'Tech careers, side hustles, and German language programs.',
    highlight: 'Skills that pay off.',
    caption: 'From learning to landing your dream role.',
  },
];

export default function SplashScreen() {
  const { colors } = useAppTheme();
  const styles = makeStyles(colors);
  const router = useRouter();
  const [routing, setRouting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateToNext = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    const interval = setInterval(animateToNext, 3000);
    return () => clearInterval(interval);
  }, [animateToNext]);

  const handleStart = async () => {
    if (routing) return;
    setRouting(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/landing');
        return;
      }

      const hasAccount = await AsyncStorage.getItem('gr_has_account');
      if (hasAccount) {
        router.push('/login');
      } else {
        router.push('/signup');
      }
    } finally {
      setRouting(false);
    }
  };

  const current = slides[activeIndex];

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.backgroundLayer}>
          <ImageBackground source={{ uri: MAP_IMAGE }} style={styles.map} />
          <View style={styles.glow} />
        </View>

        <View style={styles.brandPill}>
          <View style={styles.brandIcon}>
            <MaterialIcons name="public" size={18} color="#fff" />
          </View>
          <Text style={styles.brandText}>GlobalReady</Text>
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.ringOuter} />
          <View style={styles.ringInner} />
          <View style={styles.heroImage}>
            <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
          </View>
          <View style={styles.flightBadge}>
            <View style={styles.flightInner}>
              <MaterialIcons name="flight-takeoff" size={26} color="#fff" />
            </View>
          </View>
        </View>

        <Animated.View
          style={[
            styles.copy,
            { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
          ]}
        >
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.subtitle}>
            {current.subtitle}
            {'\n'}
            <Text style={styles.subtitleHighlight}>{current.highlight}</Text>
          </Text>
          <Text style={styles.caption}>{current.caption}</Text>
        </Animated.View>

        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, activeIndex === i && styles.dotActive]} />
          ))}
        </View>

        <PrimaryButton
          label={routing ? 'Checking...' : 'Start Your Journey'}
          icon={routing ? undefined : 'arrow-forward'}
          onPress={handleStart}
          disabled={routing}
          style={styles.cta}
        />
      </View>
    </Screen>
  );
}

const makeStyles = (c: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    opacity: 0.12,
  },
  glow: {
    position: 'absolute',
    top: -80,
    left: -80,
    right: -80,
    height: 260,
    borderRadius: 260,
    backgroundColor: 'rgba(13, 108, 242, 0.18)',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: c.navBorder,
  },
  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandText: {
    color: c.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroWrap: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    marginBottom: 32,
  },
  ringOuter: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: 'rgba(13, 108, 242, 0.2)',
  },
  ringInner: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(13, 108, 242, 0.12)',
  },
  heroImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  logoImage: {
    width: 160,
    height: 160,
  },
  flightBadge: {
    position: 'absolute',
    bottom: 16,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: c.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13, 108, 242, 0.3)',
  },
  flightInner: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 100,
  },
  title: {
    color: c.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  subtitleHighlight: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  caption: {
    color: c.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  cta: {
    width: '100%',
    marginTop: 'auto',
  },
});
