import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Stop, Rect, Line, Polyline } from 'react-native-svg';

import { useColorScheme } from '@/hooks/use-color-scheme';

// ── Theme ─────────────────────────────────────────────────────────────────────
type Theme = Record<string, string>;

const theme: { light: Theme; dark: Theme } = {
  light: {
    background: '#FFFFFF',
    card: '#FAFAF8',
    cardBorder: '#EEEBE6',
    navBtn: '#FAFAFA',
    navBtnBorder: '#EBEBEB',
    navBtnIcon: '#1A1A1A',
    dotInactive: '#E8E4DF',
    headline: '#1A1A1A',
    subtext: '#A89F95',
    permCardTitle: '#1A1A1A',
    permCardCaption: '#A89F95',
    iconCircleBg: '#FF740D',
    widgetBg: '#F0F4F8',
    widgetBorder: 'rgba(255,255,255,0.8)',
    widgetLabel: 'rgba(30,60,100,0.5)',
    widgetInner: '#FFF8F0',
    widgetInnerBorder: 'rgba(255,116,13,0.18)',
    widgetHabitName: '#1A1A1A',
    widgetStreakLabel: '#A89F95',
    widgetDayFilled: '#FF740D',
    widgetDayEmpty: 'rgba(0,0,0,0.07)',
    widgetDayLabelFilled: '#FF740D',
    widgetDayLabelEmpty: '#C5BFB8',
    footerText: '#C5BFB8',
  },
  dark: {
    background: '#1A1A1A',
    card: '#2A2A2A',
    cardBorder: '#383838',
    navBtn: '#2A2A2A',
    navBtnBorder: '#333333',
    navBtnIcon: '#F5F5F5',
    dotInactive: '#444444',
    headline: '#F5F5F5',
    subtext: '#666666',
    permCardTitle: '#F5F5F5',
    permCardCaption: '#666666',
    iconCircleBg: '#CC6A00',
    widgetBg: '#252525',
    widgetBorder: 'rgba(255,255,255,0.08)',
    widgetLabel: 'rgba(255,255,255,0.3)',
    widgetInner: '#333333',
    widgetInnerBorder: 'rgba(255,116,13,0.25)',
    widgetHabitName: '#F5F5F5',
    widgetStreakLabel: '#888888',
    widgetDayFilled: '#FF740D',
    widgetDayEmpty: 'rgba(255,255,255,0.10)',
    widgetDayLabelFilled: '#FF740D',
    widgetDayLabelEmpty: '#555555',
    footerText: '#555555',
  },
};

// ── Icons ─────────────────────────────────────────────────────────────────────
function BellIcon({ color = '#fff', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <Path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </Svg>
  );
}

function PhoneIcon({ color = '#fff', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="5" y="2" width="14" height="20" rx="3"/>
      <Line x1="12" y1="18" x2="12.01" y2="18"/>
    </Svg>
  );
}

function ChevLeft({ color = '#1A1A1A', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 18l-6-6 6-6"/>
    </Svg>
  );
}

function CheckIcon({ color = '#fff', size = 14 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12"/>
    </Svg>
  );
}

function ArrowRight({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14M12 5l7 7-7 7"/>
    </Svg>
  );
}

function FlameWidgetIcon({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="wfg2" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#FFD966"/>
          <Stop offset="100%" stopColor="#FF6500"/>
        </LinearGradient>
      </Defs>
      <Path d="M12 2c0 6-6 8-6 14a6 6 0 0 0 12 0c0-6-6-8-6-14z" fill="url(#wfg2)" stroke="none"/>
      <Path d="M12 11c0 3-2 4-2 6a2 2 0 0 0 4 0c0-2-2-3-2-6z" fill="white" fillOpacity={0.35} stroke="none"/>
    </Svg>
  );
}

// ── Permission Card ───────────────────────────────────────────────────────────
function PermCard({
  icon, title, caption, btnLabel, filled, allowed, onAllow, t,
}: {
  icon: React.ReactNode; title: string; caption: string;
  btnLabel: string; filled: boolean; allowed: boolean;
  onAllow: () => void;
  t: Theme;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <View style={[styles.permCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
      <View style={[styles.permIconCircle, { backgroundColor: t.iconCircleBg }]}>
        {icon}
      </View>
      <View style={styles.permText}>
        <Text style={[styles.permTitle, { color: t.permCardTitle }]}>{title}</Text>
        <Text style={[styles.permCaption, { color: t.permCardCaption }]}>{caption}</Text>
      </View>
      {allowed ? (
        <View style={styles.checkCircle}>
          <CheckIcon />
        </View>
      ) : (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable
            onPress={onAllow}
            onPressIn={pressIn}
            onPressOut={pressOut}
            style={[
              styles.permBtn,
              filled
                ? { backgroundColor: '#FF740D', borderWidth: 0 }
                : { borderWidth: 1.5, borderColor: '#FF740D', backgroundColor: 'transparent' },
            ]}
          >
            <Text style={[styles.permBtnText, { color: filled ? '#FFFFFF' : '#FF740D' }]}>{btnLabel}</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

// ── Widget Preview ────────────────────────────────────────────────────────────
function WidgetPreview({ t }: { t: Theme }) {
  const floatY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -4, duration: 1750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 1750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.widgetOuter}>
      <Animated.View style={[styles.widgetPhone, { backgroundColor: t.widgetBg, borderColor: t.widgetBorder }, { transform: [{ translateY: floatY }] }]}>
        <Text style={[styles.widgetHomeLabel, { color: t.widgetLabel }]}>HOME SCREEN</Text>
        <View style={[styles.widgetInner, { backgroundColor: t.widgetInner, borderColor: t.widgetInnerBorder }]}>
          <View style={styles.widgetTopRow}>
            <Text style={styles.widgetAppName}>StreakUp</Text>
            <FlameWidgetIcon size={16} />
          </View>
          <Text style={[styles.widgetHabitName, { color: t.widgetHabitName }]}>Morning Run</Text>
          <View style={styles.widgetStreakRow}>
            <Text style={styles.widgetStreakCount}>3</Text>
            <Text style={[styles.widgetStreakLabel, { color: t.widgetStreakLabel }]}>day streak</Text>
          </View>
          <View style={styles.widgetDays}>
            {DAYS.map((d, i) => (
              <View key={i} style={styles.widgetDayCol}>
                <View style={[styles.widgetDayBar, { backgroundColor: i < 3 ? t.widgetDayFilled : t.widgetDayEmpty }]} />
                <Text style={[styles.widgetDayLabel, { color: i < 3 ? t.widgetDayLabelFilled : t.widgetDayLabelEmpty }]}>{d}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function OnboardingStep3() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? theme.dark : theme.light;

  const [notifAllowed, setNotifAllowed] = useState(false);
  const [widgetAllowed, setWidgetAllowed] = useState(false);

  const fadeAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(10))).current;

  useEffect(() => {
    const delays = [0, 100, 180, 280, 380];
    Animated.parallel(
      fadeAnims.map((anim, i) =>
        Animated.parallel([
          Animated.timing(anim, { toValue: 1, duration: 450, delay: delays[i], easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(slideAnims[i], { toValue: 0, duration: 450, delay: delays[i], easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ])
      )
    ).start();
  }, []);

  const animStyle = (i: number) => ({
    opacity: fadeAnims[i],
    transform: [{ translateY: slideAnims[i] }],
  });

  return (
    <View style={[styles.container, { backgroundColor: t.background, paddingTop: insets.top }]}>

      {/* Top nav */}
      <Animated.View style={[styles.topNav, animStyle(0)]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.navBtn, { backgroundColor: t.navBtn, borderColor: t.navBtnBorder }]}
          hitSlop={8}
        >
          <ChevLeft color={t.navBtnIcon} />
        </Pressable>

        {/* Progress dots — step 3 of 3 */}
        <View style={styles.dotsRow}>
          {[false, false, true].map((active, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: active ? '#FF740D' : t.dotInactive, width: active ? 20 : 6 }]} />
          ))}
        </View>

        <View style={{ width: 38 }} />
      </Animated.View>

      {/* Heading */}
      <Animated.View style={[styles.heading, animStyle(1)]}>
        <Text style={[styles.headline, { color: t.headline }]}>Never miss a day.</Text>
        <Text style={[styles.subtext, { color: t.subtext }]}>
          Set up reminders and keep your streak visible.
        </Text>
      </Animated.View>

      {/* Permission cards */}
      <Animated.View style={[styles.cardsSection, animStyle(2)]}>
        <PermCard
          icon={<BellIcon color="#fff" size={19} />}
          title="Daily reminders"
          caption="We'll nudge you before midnight."
          btnLabel="Allow"
          filled={true}
          allowed={notifAllowed}
          onAllow={() => setNotifAllowed(true)}
          t={t}
        />
        <PermCard
          icon={<PhoneIcon color="#fff" size={19} />}
          title="Home screen widget"
          caption="See your streaks without opening the app."
          btnLabel="Set Up"
          filled={false}
          allowed={widgetAllowed}
          onAllow={() => setWidgetAllowed(true)}
          t={t}
        />
      </Animated.View>

      {/* Widget preview */}
      <Animated.View style={animStyle(3)}>
        <WidgetPreview t={t} />
      </Animated.View>

      <View style={{ flex: 1 }} />

      {/* CTA */}
      <Animated.View style={[styles.ctaArea, { paddingBottom: insets.bottom + 12 }, animStyle(4)]}>
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
        >
          <Text style={styles.ctaBtnText}>All Done</Text>
          <ArrowRight size={18} />
        </Pressable>
        <Text style={[styles.footerText, { color: t.footerText }]}>
          You can change these in Settings anytime
        </Text>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 99 },
  heading: {
    paddingHorizontal: 24,
    paddingTop: 22,
    alignItems: 'center',
    gap: 8,
  },
  headline: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28, lineHeight: 34,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15, lineHeight: 22,
    textAlign: 'center',
  },
  cardsSection: {
    marginHorizontal: 20,
    marginTop: 22,
    gap: 12,
  },
  permCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  permIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  permText: { flex: 1, minWidth: 0 },
  permTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15, lineHeight: 20,
  },
  permCaption: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12.5, lineHeight: 18,
    marginTop: 2,
  },
  checkCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#4CAF50',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  permBtn: {
    height: 34, paddingHorizontal: 14,
    borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  permBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13.5,
  },
  widgetOuter: {
    alignItems: 'center',
    marginTop: 20,
  },
  widgetPhone: {
    borderRadius: 22,
    padding: 16,
    width: 200,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 4,
  },
  widgetHomeLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11, letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 10,
  },
  widgetInner: {
    borderRadius: 18,
    padding: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  widgetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  widgetAppName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10, color: '#FF740D',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  widgetHabitName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13, lineHeight: 16,
    marginBottom: 6,
  },
  widgetStreakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  widgetStreakCount: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28, lineHeight: 28,
    color: '#FF740D',
  },
  widgetStreakLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  widgetDays: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  widgetDayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  widgetDayBar: {
    width: '100%',
    height: 16,
    borderRadius: 4,
  },
  widgetDayLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 7.5,
  },
  ctaArea: {
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
  },
  ctaBtn: {
    width: '100%', height: 54, borderRadius: 27,
    backgroundColor: '#FF740D',
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF6500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaBtnPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.12,
  },
  ctaBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16, color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  footerText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12.5, lineHeight: 18,
    textAlign: 'center',
  },
});
