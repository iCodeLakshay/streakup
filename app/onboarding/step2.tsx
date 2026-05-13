import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Ellipse, Circle, Line } from 'react-native-svg';

import { useColorScheme } from '@/hooks/use-color-scheme';

// ── Theme ─────────────────────────────────────────────────────────────────────
const theme = {
  light: {
    background: '#FFFFFF',
    card: '#FAFAF8',
    cardBorder: '#EEEBE6',
    cardDivider: '#F0EDE8',
    navBtn: '#FAFAFA',
    navBtnBorder: '#EBEBEB',
    navBtnIcon: '#1A1A1A',
    dotInactive: '#E8E4DF',
    headline: '#1A1A1A',
    subtext: '#A89F95',
    inputText: '#1A1A1A',
    inputName: '#1A1A1A',
    noteText: '#888888',
    placeholder: '#C5BFB8',
    clearBtn: '#E8E4DF',
    clearIcon: '#888888',
    iconBadgeBg: '#FFF3E0',
    iconBadgeBorder: '#FFD49A',
    chipBg: '#FAFAF8',
    chipBorder: '#EEEBE6',
    chipText: '#888888',
    chipActiveBg: '#FFF3E0',
    chipActiveBorder: '#FF8C00',
    chipActiveText: '#FF7200',
    quickPickLabel: '#C5BFB8',
    iconBtnBg: '#FAFAF8',
    iconBtnBorder: '#EEEBE6',
    iconBtnActiveBg: '#FFF3E0',
    iconBtnActiveBorder: '#FF8C00',
    ctaDisabledBg: '#F0EDE8',
    ctaDisabledText: '#C5BFB8',
  },
  dark: {
    background: '#1A1A1A',
    card: '#2A2A2A',
    cardBorder: '#383838',
    cardDivider: '#333333',
    navBtn: '#2A2A2A',
    navBtnBorder: '#333333',
    navBtnIcon: '#F5F5F5',
    dotInactive: '#333333',
    headline: '#F5F5F5',
    subtext: '#666666',
    inputText: '#F5F5F5',
    inputName: '#F5F5F5',
    noteText: '#777777',
    placeholder: '#555555',
    clearBtn: '#444444',
    clearIcon: '#AAAAAA',
    iconBadgeBg: 'rgba(255,140,0,0.15)',
    iconBadgeBorder: 'rgba(255,140,0,0.35)',
    chipBg: '#333333',
    chipBorder: '#383838',
    chipText: '#9E9E9E',
    chipActiveBg: 'rgba(255,140,0,0.15)',
    chipActiveBorder: '#FF8C00',
    chipActiveText: '#FF8C00',
    quickPickLabel: '#555555',
    iconBtnBg: '#333333',
    iconBtnBorder: '#383838',
    iconBtnActiveBg: '#FF8C00',
    iconBtnActiveBorder: '#FF8C00',
    ctaDisabledBg: '#2A2A2A',
    ctaDisabledText: '#555555',
  },
} as const;

// ── SVG Icons ─────────────────────────────────────────────────────────────────
type IconName = 'run' | 'drop' | 'book' | 'lotus' | 'dumbbell' | 'salad' | 'moon' | 'pen' | 'chevLeft' | 'close';

function Icon({ name, size = 20, color = '#FF8C00', strokeWidth = 1.8 }: {
  name: IconName; size?: number; color?: string; strokeWidth?: number;
}) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'run': return <Svg {...props}><Path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/><Path d="M7.5 17.5 10 13l3 2 2-5.5"/><Path d="M5 10.5c2-1.5 4-.5 5.5 0s3.5.5 5-1"/></Svg>;
    case 'drop': return <Svg {...props}><Path d="M12 3C12 3 6 9.5 6 14a6 6 0 0 0 12 0c0-4.5-6-11-6-11z"/></Svg>;
    case 'book': return <Svg {...props}><Path d="M4 19V5a2 2 0 0 1 2-2h12v14"/><Path d="M4 19a2 2 0 0 0 2 2h12"/><Path d="M9 7h6M9 11h4"/></Svg>;
    case 'lotus': return <Svg {...props}><Path d="M12 17c0-4-3-7-7-5 0 3 3 5 7 5z"/><Path d="M12 17c0-4 3-7 7-5 0 3-3 5-7 5z"/><Path d="M12 17V9"/><Path d="M12 9c0-3-2-5-5-4 0 2 2 4 5 4z"/><Path d="M12 9c0-3 2-5 5-4 0 2-2 4-5 4z"/></Svg>;
    case 'dumbbell': return <Svg {...props}><Path d="M6 9h12M6 15h12"/><Rect x="3" y="7" width="3" height="10" rx="1.5"/><Rect x="18" y="7" width="3" height="10" rx="1.5"/><Rect x="7" y="11" width="2" height="2" rx="1"/><Rect x="15" y="11" width="2" height="2" rx="1"/></Svg>;
    case 'salad': return <Svg {...props}><Ellipse cx="12" cy="13" rx="9" ry="5"/><Path d="M12 13V8"/><Path d="M8 9c1-2 4-3 6-1"/><Path d="M16 9c-1-2-4-3-6-1"/></Svg>;
    case 'moon': return <Svg {...props}><Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></Svg>;
    case 'pen': return <Svg {...props}><Path d="M12 20h9"/><Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></Svg>;
    case 'chevLeft': return <Svg {...props}><Path d="M15 18l-6-6 6-6"/></Svg>;
    case 'close': return <Svg {...props} strokeWidth={2.2}><Path d="M18 6L6 18M6 6l12 12"/></Svg>;
  }
}

// ── Habit presets ─────────────────────────────────────────────────────────────
const HABITS: { key: IconName; label: string; note: string }[] = [
  { key: 'run',      label: 'Morning Run',  note: 'Start the day strong' },
  { key: 'drop',     label: 'Hydrate',      note: '8 glasses a day' },
  { key: 'book',     label: 'Read',         note: '20 pages minimum' },
  { key: 'lotus',    label: 'Meditate',     note: '10 minutes, eyes closed' },
  { key: 'dumbbell', label: 'Exercise',     note: 'Move every day' },
  { key: 'salad',    label: 'Eat clean',    note: 'No junk food' },
  { key: 'moon',     label: 'Sleep early',  note: 'Lights out by 10pm' },
  { key: 'pen',      label: 'Journal',      note: 'Write it out' },
];

// ── Screen ────────────────────────────────────────────────────────────────────
export default function OnboardingStep2() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? theme.dark : theme.light;
  const isDark = colorScheme === 'dark';

  const [habitName, setHabitName] = useState('Morning Run');
  const [note, setNote] = useState('Start the day strong');
  const [selectedKey, setSelectedKey] = useState<IconName>('run');

  const fadeAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(10))).current;

  useEffect(() => {
    const delays = [0, 100, 180, 260, 340];
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

  const handleSelect = (h: typeof HABITS[0]) => {
    setSelectedKey(h.key);
    setHabitName(h.label);
    setNote(h.note);
  };

  const canCreate = habitName.trim().length > 0;
  const selectedHabit = HABITS.find(h => h.key === selectedKey);

  return (
    <View style={[styles.container, { backgroundColor: t.background, paddingTop: insets.top }]}>

      {/* Top nav */}
      <Animated.View style={[styles.topNav, animStyle(0)]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.navBtn, { backgroundColor: t.navBtn, borderColor: t.navBtnBorder }]}
          hitSlop={8}
        >
          <Icon name="chevLeft" size={18} color={t.navBtnIcon} />
        </Pressable>

        {/* Progress dots — step 2 of 3 */}
        <View style={styles.dotsRow}>
          {[false, true, false].map((active, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: active ? '#FF8C00' : t.dotInactive, width: active ? 20 : 6 }]} />
          ))}
        </View>

        <Pressable onPress={() => router.push('/onboarding/step3' as any)}>
          <Text style={[styles.skipText, { color: '#BDBDBD' }]}>Skip</Text>
        </Pressable>
      </Animated.View>

      {/* Heading */}
      <Animated.View style={[styles.heading, animStyle(1)]}>
        <Text style={[styles.headline, { color: t.headline }]}>What habit will{'\n'}you build?</Text>
        <Text style={[styles.subtext, { color: t.subtext }]}>Start with one. You can add more later.</Text>
      </Animated.View>

      {/* Input card */}
      <Animated.View style={[styles.inputCard, { backgroundColor: t.card, borderColor: t.cardBorder }, animStyle(2)]}>
        {/* Icon + name row */}
        <View style={[styles.nameRow, { borderBottomColor: t.cardDivider }]}>
          <View style={[styles.iconBadge, { backgroundColor: t.iconBadgeBg, borderColor: t.iconBadgeBorder }]}>
            <Icon name={selectedHabit?.key ?? 'run'} size={19} color="#FF8C00" />
          </View>
          <TextInput
            value={habitName}
            onChangeText={setHabitName}
            placeholder="Habit name..."
            placeholderTextColor={t.placeholder}
            maxLength={40}
            style={[styles.nameInput, { color: t.inputName }]}
          />
          {habitName.length > 0 && (
            <Pressable onPress={() => setHabitName('')} style={[styles.clearBtn, { backgroundColor: t.clearBtn }]} hitSlop={8}>
              <Icon name="close" size={10} color={t.clearIcon} strokeWidth={2.2} />
            </Pressable>
          )}
        </View>
        {/* Note row */}
        <View style={styles.noteRow}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional)"
            placeholderTextColor={t.placeholder}
            style={[styles.noteInput, { color: t.noteText }]}
          />
        </View>
      </Animated.View>

      {/* Icon quick-pick scroll */}
      <Animated.View style={animStyle(3)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconScroll}>
          {HABITS.map((h) => {
            const active = h.key === selectedKey;
            return (
              <TouchableOpacity
                key={h.key}
                onPress={() => handleSelect(h)}
                activeOpacity={0.75}
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: active ? (isDark ? '#FF8C00' : t.iconBtnActiveBg) : t.iconBtnBg,
                    borderColor: active ? t.iconBtnActiveBorder : t.iconBtnBorder,
                  },
                ]}
              >
                <Icon name={h.key} size={20} color={active ? (isDark ? '#FFFFFF' : '#FF8C00') : (isDark ? '#666666' : '#C5BFB8')} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Quick picks */}
      <Animated.View style={[styles.quickPicksSection, animStyle(4)]}>
        <Text style={[styles.quickPickLabel, { color: t.quickPickLabel }]}>QUICK PICKS</Text>
        <View style={styles.chipsWrap}>
          {HABITS.slice(0, 5).map((h) => {
            const active = h.key === selectedKey;
            return (
              <TouchableOpacity
                key={h.key}
                onPress={() => handleSelect(h)}
                activeOpacity={0.75}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? t.chipActiveBg : t.chipBg,
                    borderColor: active ? t.chipActiveBorder : t.chipBorder,
                  },
                ]}
              >
                <Icon name={h.key} size={14} color={active ? '#FF8C00' : (isDark ? '#666666' : '#BDBDBD')} strokeWidth={2} />
                <Text style={[styles.chipText, { color: active ? t.chipActiveText : t.chipText }]}>{h.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      <View style={{ flex: 1 }} />

      {/* CTA */}
      <Animated.View style={[styles.ctaArea, { paddingBottom: insets.bottom + 24 }, animStyle(4)]}>
        <Pressable
          onPress={() => canCreate && router.push('/onboarding/step3' as any)}
          style={({ pressed }) => [
            styles.ctaBtn,
            !canCreate && { backgroundColor: t.ctaDisabledBg, shadowOpacity: 0 },
            pressed && canCreate && styles.ctaBtnPressed,
          ]}
          disabled={!canCreate}
        >
          <Text style={[styles.ctaText, !canCreate && { color: t.ctaDisabledText }]}>
            Create My First Habit
          </Text>
        </Pressable>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 99,
  },
  skipText: {
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 0.1,
  },
  heading: {
    paddingHorizontal: 24,
    paddingTop: 22,
    gap: 6,
  },
  headline: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  subtext: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14.5,
    lineHeight: 22,
  },
  inputCard: {
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    lineHeight: 24,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  noteRow: {
    paddingTop: 10,
    paddingBottom: 12,
    paddingLeft: 70,
    paddingRight: 16,
  },
  noteInput: {
    fontSize: 13.5,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 20,
  },
  iconScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 2,
    marginTop: 14,
    paddingBottom: 6,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPicksSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  quickPickLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13.5,
    fontFamily: 'DMSans_500Medium',
  },
  ctaArea: {
    paddingHorizontal: 24,
  },
  ctaBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
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
  ctaText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
});
