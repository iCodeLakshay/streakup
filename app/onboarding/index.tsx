import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { useColorScheme } from '@/hooks/use-color-scheme';

const SLIDES = [
  {
    headline: 'Build habits that stick.',
    subtext:  'Track your daily streaks and never break the chain.',
  },
  {
    headline: 'Small steps, big wins.',
    subtext:  'Just one minute a day is enough to start a streak.',
  },
  {
    headline: 'Never lose your streak.',
    subtext:  'StreakUp reminds you before the day slips away.',
  },
] as const;

const AUTO_ADVANCE_MS = 3000;

function FlameSVG() {
  return (
    <Svg width={120} height={148} viewBox="0 0 120 148" fill="none">
      <Defs>
        <LinearGradient id="fg1" x1="60" y1="0" x2="60" y2="148" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#FFD966" />
          <Stop offset="45%" stopColor="#FFB347" />
          <Stop offset="100%" stopColor="#FF6500" />
        </LinearGradient>
        <LinearGradient id="fg2" x1="60" y1="50" x2="60" y2="148" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
          <Stop offset="100%" stopColor="#FFD966" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="fg3" x1="60" y1="70" x2="60" y2="148" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#FFF9E6" />
          <Stop offset="60%" stopColor="#FFE066" />
          <Stop offset="100%" stopColor="#FFB347" />
        </LinearGradient>
        <RadialGradient id="fg4" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFF0CC" />
          <Stop offset="100%" stopColor="#FFB347" />
        </RadialGradient>
      </Defs>
      <Path d="M60 4 C60 4 82 28 88 52 C94 70 90 86 84 97 C78 108 68 114 60 116 C52 114 42 108 36 97 C30 86 26 70 32 52 C38 28 60 4 60 4Z" fill="url(#fg1)" />
      <Path d="M38 44 C32 36 28 24 34 14 C30 30 36 40 40 52 C38 50 38 46 38 44Z" fill="#FFD966" fillOpacity={0.7} />
      <Path d="M82 44 C88 36 92 24 86 14 C90 30 84 40 80 52 C82 50 82 46 82 44Z" fill="#FFD966" fillOpacity={0.6} />
      <Path d="M60 62 C60 62 72 74 74 88 C76 100 70 112 60 116 C50 112 44 100 46 88 C48 74 60 62 60 62Z" fill="url(#fg3)" />
      <Ellipse cx={50} cy={76} rx={6} ry={10} fill="url(#fg2)" fillOpacity={0.5} />
      <Circle cx={60} cy={96} r={10} fill="url(#fg4)" fillOpacity={0.9} />
      <Circle cx={60} cy={96} r={6} fill="white" fillOpacity={0.45} />
      <Circle cx={75} cy={50} r={3} fill="#FFE8A0" fillOpacity={0.8} />
      <Circle cx={45} cy={58} r={2} fill="#FFE8A0" fillOpacity={0.6} />
      <Circle cx={80} cy={72} r={2} fill="#FFF5CC" fillOpacity={0.7} />
    </Svg>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';

  // ── Slide state ──────────────────────────────────────────────────────────
  const [activeIdx, setActiveIdx] = useState(0);
  const slideOpacity    = useRef(new Animated.Value(1)).current;
  const slideTranslateX = useRef(new Animated.Value(0)).current;
  const swipeStartX     = useRef<number | null>(null);

  // ── Entrance animations ──────────────────────────────────────────────────
  const fade  = useRef([0,1,2,3].map(() => new Animated.Value(0))).current;
  const slide = useRef([0,1,2,3].map(() => new Animated.Value(20))).current;

  // ── Flame float ──────────────────────────────────────────────────────────
  const flameY     = useRef(new Animated.Value(0)).current;
  const flameScale = useRef(new Animated.Value(1)).current;

  // ── Glow pulse (two offset rings) ────────────────────────────────────────
  const glowA      = useRef(new Animated.Value(0.55)).current;
  const glowAScale = useRef(new Animated.Value(1)).current;
  const glowB      = useRef(new Animated.Value(0.55)).current;
  const glowBScale = useRef(new Animated.Value(1)).current;

  // ── Transition to a slide index with fade+slide animation ────────────────
  const activeIdxRef = useRef(activeIdx);
  activeIdxRef.current = activeIdx;

  const goToSlide = useCallback((next: number) => {
    const direction = next > activeIdxRef.current ? 1 : -1;
    Animated.parallel([
      Animated.timing(slideOpacity,    { toValue: 0, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(slideTranslateX, { toValue: -24 * direction, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start(() => {
      setActiveIdx(next);
      slideTranslateX.setValue(24 * direction);
      Animated.parallel([
        Animated.timing(slideOpacity,    { toValue: 1, duration: 260, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(slideTranslateX, { toValue: 0, duration: 260, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    });
  }, [slideOpacity, slideTranslateX]);

  // ── Auto-advance ─────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      goToSlide((activeIdxRef.current + 1) % SLIDES.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [goToSlide]);

  // ── Entrance + ambient animations ────────────────────────────────────────
  useEffect(() => {
    Animated.parallel(
      fade.map((a, i) =>
        Animated.parallel([
          Animated.timing(a,        { toValue: 1, duration: 550, delay: [0,80,200,440][i], easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(slide[i], { toValue: 0, duration: 550, delay: [0,80,200,440][i], easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ])
      )
    ).start();

    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(flameY,     { toValue: -8,   duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(flameScale, { toValue: 1.03, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(flameY,     { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(flameScale, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(glowA,      { toValue: 0.85, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowAScale, { toValue: 1.08, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(glowA,      { toValue: 0.55, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowAScale, { toValue: 1,    duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(glowB,      { toValue: 0.85, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowBScale, { toValue: 1.08, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(glowB,      { toValue: 0.55, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowBScale, { toValue: 1,    duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ])).start();
  }, []);

  const anim = (i: number) => ({
    opacity: fade[i],
    transform: [{ translateY: slide[i] }],
  });

  // ── Swipe handlers ───────────────────────────────────────────────────────
  const onTouchStart = (e: GestureResponderEvent) => {
    swipeStartX.current = e.nativeEvent.pageX;
  };
  const onTouchEnd = (e: GestureResponderEvent) => {
    if (swipeStartX.current === null) return;
    const dx = e.nativeEvent.pageX - swipeStartX.current;
    swipeStartX.current = null;
    if (Math.abs(dx) < 30) return;
    const next = dx < 0
      ? Math.min(activeIdx + 1, SLIDES.length - 1)
      : Math.max(activeIdx - 1, 0);
    if (next !== activeIdx) goToSlide(next);
  };

  const headlineColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const dotInactive   = isDark ? '#444444' : '#E0E0E0';

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      {/* Skip */}
      <Animated.View style={[styles.skipWrap, anim(0)]}>
        <Pressable onPress={() => router.replace('/(tabs)')} hitSlop={12} style={styles.skipBtn}>
          {({ pressed }) => (
            <Text style={[styles.skipText, { opacity: pressed ? 0.5 : 1 }]}>Skip</Text>
          )}
        </Pressable>
      </Animated.View>

      {/* ── Middle: vertically centered ── */}
      <View
        style={styles.middle}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Hero */}
        <Animated.View style={[styles.hero, anim(1)]}>
          <Animated.View style={[
            styles.glowRing,
            isDark
              ? { width: 320, height: 320, marginLeft: -160, marginTop: -160, backgroundColor: 'rgba(255,160,50,0.22)' }
              : { width: 260, height: 260, marginLeft: -130, marginTop: -130, backgroundColor: 'rgba(255,179,71,0.18)' },
            { opacity: glowA, transform: [{ scale: glowAScale }] },
          ]} />
          <Animated.View style={[
            styles.glowRing,
            isDark
              ? { width: 200, height: 200, marginLeft: -100, marginTop: -100, backgroundColor: 'rgba(255,200,80,0.22)' }
              : { width: 180, height: 180, marginLeft:  -90, marginTop:  -90, backgroundColor: 'rgba(255,210,100,0.25)' },
            { opacity: glowB, transform: [{ scale: glowBScale }] },
          ]} />
          {isDark && (
            <Animated.View style={[styles.glowCore, { opacity: glowA, transform: [{ scale: glowAScale }] }]} />
          )}
          <Animated.View style={{ transform: [{ translateY: flameY }, { scale: flameScale }], zIndex: 2 }}>
            <FlameSVG />
          </Animated.View>
        </Animated.View>

        {/* Sliding copy — fades + slides on change */}
        <Animated.View style={[styles.copy, anim(2), { opacity: slideOpacity, transform: [{ translateX: slideTranslateX }] }]}>
          <Text style={[styles.headline, { color: headlineColor }]}>
            {SLIDES[activeIdx].headline}
          </Text>
          <Text style={styles.subtext}>
            {SLIDES[activeIdx].subtext}
          </Text>
        </Animated.View>

        {/* Dots — active dot tracks current slide */}
        <Animated.View style={[styles.dots, anim(2)]}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => goToSlide(i)} hitSlop={8}>
              <View style={[styles.dot, {
                width: i === activeIdx ? 22 : 8,
                backgroundColor: i === activeIdx ? '#FF8C00' : dotInactive,
              }]} />
            </Pressable>
          ))}
        </Animated.View>
      </View>

      {/* ── CTA pinned to bottom ── */}
      <Animated.View style={[styles.cta, anim(3)]}>
        <Pressable
          onPress={() => router.push('/onboarding/habit-picker' as any)}
          style={({ pressed }) => [styles.getStartedBtn, pressed && styles.getStartedBtnPressed]}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </Pressable>
        <Text style={[styles.loginText, { color: '#9E9E9E' }]}>
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
  screen: {
    flex: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  skipWrap: {
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
    color: '#9E9E9E',
  },
  middle: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    width: '100%',
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    borderRadius: 999,
    left: '50%',
    top: '50%',
  },
  glowCore: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: 'rgba(255,220,120,0.15)',
    left: '50%',
    top: '50%',
    marginLeft: -65,
    marginTop: -65,
  },
  copy: {
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
    color: '#9E9E9E',
    textAlign: 'center',
    maxWidth: 260,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
  },
  dot: {
    height: 8,
    borderRadius: 99,
  },
  cta: {
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
    opacity: 0.9,
  },
  getStartedText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
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
  },
});
