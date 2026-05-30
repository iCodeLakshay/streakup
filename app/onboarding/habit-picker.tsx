import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, StyleSheet, TextInput, TouchableOpacity,
  Pressable, ScrollView, View, Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmojiKeyboard from 'rn-emoji-keyboard';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHabitStore } from '@/stores/habitStore';

const HABITS = [
  { emoji: '🏃', label: 'Morning Run',  note: 'Start the day strong' },
  { emoji: '💧', label: 'Hydrate',      note: '8 glasses a day' },
  { emoji: '📚', label: 'Read',         note: '20 pages minimum' },
  { emoji: '🧘', label: 'Meditate',     note: '10 minutes, eyes closed' },
  { emoji: '💪', label: 'Exercise',     note: 'Move every day' },
  { emoji: '🥗', label: 'Eat clean',    note: 'No junk food' },
  { emoji: '😴', label: 'Sleep early',  note: 'Lights out by 10pm' },
  { emoji: '✍️', label: 'Journal',      note: 'Write it out' },
];

export default function HabitPickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const addHabit = useHabitStore((s) => s.addHabit);

  const [habitName, setHabitName] = useState('Morning Run');
  const [note, setNote] = useState('Start the day strong');
  const [selectedEmoji, setSelectedEmoji] = useState('🏃');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

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
    setSelectedEmoji(h.emoji);
    setHabitName(h.label);
    setNote(h.note);
  };

  const canCreate = habitName.trim().length > 0;

  const handleCreate = async () => {
    if (!canCreate) return;
    await addHabit({
      name: habitName.trim(),
      emoji: selectedEmoji,
      color: '#FF740D',
      note: note.trim(),
    });
    router.push('/onboarding/permissions' as any);
  };

  // Theme tokens
  const bg = isDark ? '#1A1A1A' : '#FFFFFF';
  const cardBg = isDark ? '#2A2A2A' : '#FAFAF8';
  const cardBorder = isDark ? '#383838' : '#EEEBE6';
  const cardDivider = isDark ? '#333333' : '#F0EDE8';
  const headlineColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const subtextColor = isDark ? '#666666' : '#A89F95';
  const navBtnBg = isDark ? '#2A2A2A' : '#FAFAFA';
  const navBtnBorder = isDark ? '#333333' : '#EBEBEB';
  const inputNameColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const noteColor = isDark ? '#777777' : '#888888';
  const placeholderColor = isDark ? '#555555' : '#C5BFB8';
  const clearBtnBg = isDark ? '#444444' : '#E8E4DF';
  const clearIconColor = isDark ? '#AAAAAA' : '#888888';
  const dotInactive = isDark ? '#333333' : '#E8E4DF';
  const iconBtnBg = isDark ? '#333333' : '#FAFAF8';
  const iconBtnBorder = isDark ? '#383838' : '#EEEBE6';
  const chipBg = isDark ? '#333333' : '#FAFAF8';
  const chipBorder = isDark ? '#383838' : '#EEEBE6';
  const chipText = isDark ? '#9E9E9E' : '#888888';
  const ctaDisabledBg = isDark ? '#2A2A2A' : '#F0EDE8';
  const ctaDisabledText = isDark ? '#555555' : '#C5BFB8';
  const quickPicksLabel = isDark ? '#555555' : '#C5BFB8';
  const navIconColor = isDark ? '#F5F5F5' : '#1A1A1A';

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top }]}>

      {/* Top nav */}
      <Animated.View style={[styles.topNav, animStyle(0)]}>
        <Pressable
          onPress={() => router.replace('/onboarding' as any)}
          style={[styles.navBtn, { backgroundColor: navBtnBg, borderColor: navBtnBorder }]}
          hitSlop={8}
        >
          <Text style={[styles.chevron, { color: navIconColor }]}>‹</Text>
        </Pressable>

        <View style={styles.dots}>
          {[false, true, false].map((active, i) => (
            <View
              key={i}
              style={[styles.dot, { width: active ? 20 : 6, backgroundColor: active ? '#FF8C00' : dotInactive }]}
            />
          ))}
        </View>

        <Pressable onPress={() => router.push('/onboarding/permissions' as any)} hitSlop={8}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </Animated.View>

      {/* Heading */}
      <Animated.View style={[styles.heading, animStyle(1)]}>
        <Text style={[styles.headline, { color: headlineColor }]}>
          {'What habit will\nyou build?'}
        </Text>
        <Text style={[styles.subtext, { color: subtextColor }]}>
          Start with one. You can add more later.
        </Text>
      </Animated.View>

      {/* Input card */}
      <Animated.View style={[styles.inputCard, animStyle(2)]}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {/* Emoji + name row */}
          <View style={[styles.cardRow, { borderBottomColor: cardDivider }]}>
            <Text style={styles.emojiBadge}>{selectedEmoji}</Text>
            <TextInput
              value={habitName}
              onChangeText={setHabitName}
              placeholder="Habit name..."
              placeholderTextColor={placeholderColor}
              maxLength={40}
              style={[styles.nameInput, { color: inputNameColor }]}
            />
            {habitName.length > 0 && (
              <Pressable
                onPress={() => setHabitName('')}
                style={[styles.clearBtn, { backgroundColor: clearBtnBg }]}
                hitSlop={8}
              >
                <Text style={[styles.clearX, { color: clearIconColor }]}>✕</Text>
              </Pressable>
            )}
          </View>
          {/* Note row */}
          <View style={styles.noteRow}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note (optional)"
              placeholderTextColor={placeholderColor}
              style={[styles.noteInput, { color: noteColor }]}
            />
          </View>
        </View>
      </Animated.View>

      {/* Emoji quick-pick horizontal scroll + sticky + button */}
      <Animated.View style={[styles.iconScrollWrap, animStyle(3)]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.iconScroll}
        >
          {HABITS.map((h) => {
            const active = h.emoji === selectedEmoji;
            return (
              <TouchableOpacity
                key={h.emoji}
                onPress={() => handleSelect(h)}
                activeOpacity={0.75}
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: active ? (isDark ? '#FF8C00' : '#FFF3E0') : iconBtnBg,
                    borderColor: active ? '#FF8C00' : iconBtnBorder,
                  },
                ]}
              >
                <Text style={styles.iconBtnEmoji}>{h.emoji}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sticky + button — always visible at the right edge */}
        <Pressable
          onPress={() => setEmojiPickerOpen(true)}
          style={[styles.addEmojiBtn, { backgroundColor: isDark ? '#333333' : '#F5F3F0', borderColor: isDark ? '#444444' : '#E0DDD8' }]}
          hitSlop={4}
        >
          <Text style={[styles.addEmojiBtnText, { color: isDark ? '#AAAAAA' : '#888888' }]}>+</Text>
        </Pressable>
      </Animated.View>

      <EmojiKeyboard
        onEmojiSelected={(e) => {
          setSelectedEmoji(e.emoji);
          setEmojiPickerOpen(false);
        }}
        open={emojiPickerOpen}
        onClose={() => setEmojiPickerOpen(false)}
        enableSearchBar
        theme={{
          backdrop: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)',
          knob: '#FF740D',
          container: isDark ? '#1A1A1A' : '#FFFFFF',
          header: isDark ? '#F5F5F5' : '#1A1A1A',
          skinTonesContainer: isDark ? '#2A2A2A' : '#F5F3F0',
          category: {
            icon: isDark ? '#888888' : '#AAAAAA',
            iconActive: '#FF740D',
            container: isDark ? '#2A2A2A' : '#F5F3F0',
            containerActive: isDark ? '#3A3A3A' : '#FFE8D6',
          },
          search: {
            text: isDark ? '#F5F5F5' : '#1A1A1A',
            placeholder: isDark ? '#666666' : '#AAAAAA',
            icon: isDark ? '#888888' : '#AAAAAA',
            background: isDark ? '#2A2A2A' : '#F5F3F0',
          },
        }}
      />

      {/* Quick picks chips */}
      <Animated.View style={[styles.quickPicks, animStyle(4)]}>
        <Text style={[styles.quickPicksLabel, { color: quickPicksLabel }]}>QUICK PICKS</Text>
        <View style={styles.chipsWrap}>
          {HABITS.slice(0, 5).map((h) => {
            const active = h.emoji === selectedEmoji;
            return (
              <TouchableOpacity
                key={h.emoji}
                onPress={() => handleSelect(h)}
                activeOpacity={0.75}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? (isDark ? 'rgba(255,140,0,0.15)' : '#FFF3E0') : chipBg,
                    borderColor: active ? '#FF8C00' : chipBorder,
                  },
                ]}
              >
                <Text style={styles.chipEmoji}>{h.emoji}</Text>
                <Text style={[styles.chipText, { color: active ? (isDark ? '#FF8C00' : '#FF7200') : chipText }]}>
                  {h.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      <View style={{ flex: 1 }} />

      {/* CTA */}
      <Animated.View style={[styles.cta, { paddingBottom: insets.bottom + 24 }, animStyle(4)]}>
        <Pressable
          onPress={handleCreate}
          disabled={!canCreate}
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: canCreate ? '#FF8C00' : ctaDisabledBg },
            canCreate && styles.ctaBtnShadow,
            pressed && canCreate && styles.ctaBtnPressed,
          ]}
        >
          <Text style={[styles.ctaText, { color: canCreate ? '#FFFFFF' : ctaDisabledText }]}>
            Create My First Habit
          </Text>
        </Pressable>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
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
  chevron: {
    fontSize: 26,
    lineHeight: 30,
    fontFamily: 'DMSans_400Regular',
  },
  dots: {
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
    color: '#BDBDBD',
    letterSpacing: 0.1,
  },
  heading: {
    paddingHorizontal: 24,
    paddingTop: 22,
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
    marginTop: 6,
  },
  inputCard: {
    marginHorizontal: 20,
    marginTop: 18,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  emojiBadge: {
    fontSize: 26,
    lineHeight: 32,
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
  clearX: {
    fontSize: 10,
    lineHeight: 14,
  },
  noteRow: {
    paddingTop: 10,
    paddingBottom: 12,
    paddingRight: 16,
    paddingLeft: 70,
  },
  noteInput: {
    fontSize: 13.5,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 20,
    width: '100%',
  },
  iconScrollWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 20,
  },
  iconScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 14,
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
  iconBtnEmoji: {
    fontSize: 24,
  },
  addEmojiBtn: {
    width: 48,
    height: 48,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 8,
    marginBottom: 6,
  },
  addEmojiBtnText: {
    fontSize: 22,
    lineHeight: 26,
    fontFamily: 'DMSans_400Regular',
  },
  quickPicks: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  quickPicksLabel: {
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
  chipEmoji: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 13.5,
    fontFamily: 'DMSans_500Medium',
  },
  cta: {
    paddingHorizontal: 24,
  },
  ctaBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnShadow: {
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
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.1,
  },
});
