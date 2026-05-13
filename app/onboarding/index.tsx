import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

import { useColorScheme } from '@/hooks/use-color-scheme';

// ── Theme tokens ───────────────────────────────────────────────────────────────
const theme = {
  light: {
    background: '#FFFFFF',
    headline: '#1A1A1A',
    subtext: '#9E9E9E',
    dotInactive: '#E0E0E0',
    loginText: '#9E9E9E',
    glowOuter: 'rgba(255,179,71,0.18)',
    glowMid: 'rgba(255,210,100,0.25)',
    glowInner: null,
  },
  dark: {
    background: '#1A1A1A',
    headline: '#F5F5F5',
    subtext: '#9E9E9E',
    dotInactive: '#444444',
    loginText: '#9E9E9E',
    glowOuter: 'rgba(255,160,50,0.22)',
    glowMid: 'rgba(255,200,80,0.22)',
    glowInner: 'rgba(255,220,120,0.15)',
  },
} as const;

// ── Flame SVG (same for both modes — flame is always vivid) ──────────────────
function FlameSVG() {
  return (
    <Svg width={120} height={148} viewBox="0 0 120 148" fill="none">
      <Defs>
        <LinearGradient id="flameGrad1" x1="60" y1="0" x2="60" y2="148" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#FFD966" />
          <Stop offset="45%" stopColor="#FFB347" />
          <Stop offset="100%" stopColor="#FF6500" />
        </LinearGradient>
        <LinearGradient id="flameGrad2" x1="60" y1="50" x2="60" y2="148" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
          <Stop offset="100%" stopColor="#FFD966" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="innerFlame" x1="60" y1="70" x2="60" y2="148" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#FFF9E6" />
          <Stop offset="60%" stopColor="#FFE066" />
          <Stop offset="100%" stopColor="#FFB347" />
        </LinearGradient>
        <RadialGradient id="dropGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFF0CC" />
          <Stop offset="100%" stopColor="#FFB347" />
        </RadialGradient>
      </Defs>
      <Path
        d="M60 4 C60 4 82 28 88 52 C94 70 90 86 84 97 C78 108 68 114 60 116 C52 114 42 108 36 97 C30 86 26 70 32 52 C38 28 60 4 60 4Z"
        fill="url(#flameGrad1)"
      />
      <Path d="M38 44 C32 36 28 24 34 14 C30 30 36 40 40 52 C38 50 38 46 38 44Z" fill="#FFD966" fillOpacity={0.7} />
      <Path d="M82 44 C88 36 92 24 86 14 C90 30 84 40 80 52 C82 50 82 46 82 44Z" fill="#FFD966" fillOpacity={0.6} />
      <Path
        d="M60 62 C60 62 72 74 74 88 C76 100 70 112 60 116 C50 112 44 100 46 88 C48 74 60 62 60 62Z"
        fill="url(#innerFlame)"
      />
      <Ellipse cx={50} cy={76} rx={6} ry={10} fill="url(#flameGrad2)" fillOpacity={0.5} />
      <Circle cx={60} cy={96} r={10} fill="url(#dropGrad)" fillOpacity={0.9} />
      <Circle cx={60} cy={96} r={6} fill="white" fillOpacity={0.45} />
      <Circle cx={75} cy={50} r={3} fill="#FFE8A0" fillOpacity={0.8} />
      <Circle cx={45} cy={58} r={2} fill="#FFE8A0" fillOpacity={0.6} />
      <Circle cx={80} cy={72} r={2} fill="#FFF5CC" fillOpacity={0.7} />
    </Svg>
  );
}

// ── Onboarding Screen ──────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? theme.dark : theme.light;
  const isDark = colorScheme === 'dark';

  // Entrance animations — 4 staggered groups
  const fadeAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(20))).current;

  // Flame float
  const flameY = useRef(new Animated.Value(0)).current;
  const flameScale = useRef(new Animated.Value(1)).current;

  // Glow pulse
  const glowOpacity = useRef(new Animated.Value(0.55)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const glowOpacity2 = useRef(new Animated.Value(0.55)).current;
  const glowScale2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delays = [0, 80, 200, 440];
    Animated.parallel(
      fadeAnims.map((anim, i) =>
        Animated.parallel([
          Animated.timing(anim, { toValue: 1, duration: 550, delay: delays[i], easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(slideAnims[i], { toValue: 0, duration: 550, delay: delays[i], easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ])
      )
    ).start();

    // Flame float
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(flameY, { toValue: -8, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(flameScale, { toValue: 1.03, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(flameY, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(flameScale, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Outer glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowOpacity, { toValue: 0.85, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowScale, { toValue: 1.08, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(glowOpacity, { toValue: 0.55, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowScale, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Inner glow pulse (offset)
    Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(glowOpacity2, { toValue: 0.85, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowScale2, { toValue: 1.08, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(glowOpacity2, { toValue: 0.55, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowScale2, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  const animStyle = (i: number) => ({
    opacity: fadeAnims[i],
    transform: [{ translateY: slideAnims[i] }],
  });

  return (
    <View style={[styles.container, { backgroundColor: t.background, paddingTop: insets.top + 8, paddingBottom: insets.bottom }]}>

      {/* Skip */}
      <Animated.View style={[styles.skipContainer, animStyle(0)]}>
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.5 }]}
          hitSlop={12}
        >
          <Text style={[styles.skipText, { color: t.subtext }]}>Skip</Text>
        </Pressable>
      </Animated.View>

      {/* Hero: glow rings + flame */}
      <Animated.View style={[styles.heroArea, animStyle(1)]}>
        {/* Outer glow */}
        <Animated.View style={[
          styles.glowOuter,
          isDark ? styles.glowOuterDark : styles.glowOuterLight,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]} />
        {/* Mid glow */}
        <Animated.View style={[
          styles.glowMid,
          isDark ? styles.glowMidDark : styles.glowMidLight,
          { opacity: glowOpacity2, transform: [{ scale: glowScale2 }] },
        ]} />
        {/* Dark-only inner core glow */}
        {isDark && (
          <Animated.View style={[
            styles.glowCore,
            { opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]} />
        )}
        {/* Flame */}
        <Animated.View style={{ transform: [{ translateY: flameY }, { scale: flameScale }] }}>
          <FlameSVG />
        </Animated.View>
      </Animated.View>

      {/* Copy */}
      <Animated.View style={[styles.copyBlock, animStyle(2)]}>
        <Text style={[styles.headline, { color: t.headline }]}>Build habits that stick.</Text>
        <Text style={[styles.subtext, { color: t.subtext }]}>
          Track your daily streaks and never break the chain.
        </Text>
      </Animated.View>

      {/* Pagination dots */}
      <Animated.View style={[styles.dotsRow, animStyle(2)]}>
        {[true, false, false].map((active, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              active ? styles.dotActive : { width: 8, backgroundColor: t.dotInactive },
            ]}
          />
        ))}
      </Animated.View>

      <View style={{ flex: 1 }} />

      {/* CTA */}
      <Animated.View style={[styles.ctaArea, animStyle(3)]}>
        <Pressable
          onPress={() => router.push('/onboarding/step2' as any)}
          style={({ pressed }) => [styles.getStartedBtn, pressed && styles.getStartedBtnPressed]}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </Pressable>

        <Text style={[styles.loginText, { color: t.loginText }]}>
          Already have an account?{' '}
          <Text style={styles.loginLink} onPress={() => router.push('/login' as any)}>
            Log in
          </Text>
        </Text>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  skipContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
  },
  heroArea: {
    marginTop: 32,
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowOuter: {
    position: 'absolute',
    borderRadius: 160,
  },
  glowOuterLight: {
    width: 260,
    height: 260,
    backgroundColor: 'rgba(255,179,71,0.18)',
  },
  glowOuterDark: {
    width: 320,
    height: 320,
    backgroundColor: 'rgba(255,160,50,0.22)',
  },
  glowMid: {
    position: 'absolute',
    borderRadius: 100,
  },
  glowMidLight: {
    width: 180,
    height: 180,
    backgroundColor: 'rgba(255,210,100,0.25)',
  },
  glowMidDark: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255,200,80,0.22)',
  },
  glowCore: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,220,120,0.15)',
  },
  copyBlock: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
    marginTop: 12,
  },
  headline: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 260,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
  },
  dot: {
    height: 8,
    borderRadius: 100,
  },
  dotActive: {
    width: 22,
    backgroundColor: '#FF8C00',
  },
  ctaArea: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 16,
  },
  getStartedBtn: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedBtnPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.15,
  },
  getStartedText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  loginText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
  },
  loginLink: {
    color: '#FF8C00',
    fontFamily: 'DMSans_700Bold',
    fontWeight: '600',
  },
});
