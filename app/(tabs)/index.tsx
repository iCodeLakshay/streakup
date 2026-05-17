import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Easing, FlatList, ListRenderItem, Pressable,
  StyleSheet, Text, View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  useHabitStore, getTodayDateString, getStreakCount,
  type Habit, type Completion,
} from '@/stores/habitStore';
import { HabitCard } from '@/components/HabitCard';
import { AddHabitSheet } from '@/components/AddHabitSheet';

// ─── Types ────────────────────────────────────────────────────────────────────

type ListItem =
  | { type: 'habit'; habit: Habit; isCompleted: boolean; dimmed: boolean }
  | { type: 'divider' }
  | { type: 'celebration' };

type ScreenState = 'empty' | 'some-incomplete' | 'all-complete';

// ─── Inline icons ─────────────────────────────────────────────────────────────

function FlameIcon({ size = 80 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="fg" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#FFD966" />
          <Stop offset="100%" stopColor="#FF6500" />
        </LinearGradient>
      </Defs>
      <Path d="M12 2c0 6-6 8-6 14a6 6 0 0 0 12 0c0-6-6-8-6-14z" fill="url(#fg)" stroke="none" />
      <Path d="M12 11c0 3-2 4-2 6a2 2 0 0 0 4 0c0-2-2-3-2-6z" fill="white" fillOpacity={0.35} stroke="none" />
    </Svg>
  );
}

function PlusIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round">
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ isDark }: { isDark: boolean }) {
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0.9, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 0.4, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Animated.View style={{ opacity: pulseOpacity }}>
          <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
            <Circle cx={60} cy={60} r={54} stroke="#FF740D" strokeWidth={1.5} strokeDasharray="6 5" fill="none" />
          </Svg>
        </Animated.View>
        <View style={styles.emptyFlame}>
          <FlameIcon size={48} />
        </View>
      </View>
      <Text style={[styles.emptyTitle, { color: isDark ? '#F5F5F5' : '#1A1A1A' }]}>No habits yet.</Text>
      <Text style={[styles.emptySubtext, { color: isDark ? '#666666' : '#A89F95' }]}>
        Tap + to add your first habit.
      </Text>
    </View>
  );
}

function ProgressCard({
  doneCount, totalCount, progressAnim, isDark,
}: {
  doneCount: number; totalCount: number;
  progressAnim: Animated.Value; isDark: boolean;
}) {
  const cardBg = isDark ? '#2A2A2A' : '#FFF8F0';
  const cardBorder = isDark ? '#383838' : 'rgba(255,116,13,0.14)';
  const textColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const subColor = isDark ? '#666666' : '#A89F95';
  const trackBg = isDark ? '#383838' : '#F0EDE8';
  const allDone = doneCount === totalCount;
  const status = allDone ? 'All done! 🎉' : doneCount === 0 ? 'Start your first streak today 🔥' : 'Keep going!';

  const barWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.progressCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={styles.progressTop}>
        <Text style={[styles.progressCount, { color: textColor }]}>{doneCount} of {totalCount} done today</Text>
        <Text style={[styles.progressStatus, { color: subColor }]}>{status}</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: trackBg }]}>
        <Animated.View style={[styles.progressBar, { width: barWidth }]} />
      </View>
    </View>
  );
}

function SectionDivider({ isDark }: { isDark: boolean }) {
  const lineColor = isDark ? '#2A2A2A' : '#F0EDE8';
  const textColor = isDark ? '#555555' : '#C5BFB8';
  return (
    <View style={styles.divider}>
      <View style={[styles.dividerLine, { backgroundColor: lineColor }]} />
      <Text style={[styles.dividerText, { color: textColor }]}>Completed today ✓</Text>
      <View style={[styles.dividerLine, { backgroundColor: lineColor }]} />
    </View>
  );
}

function ToastBanner({
  habit, streakCount, translateY,
}: {
  habit: Habit | undefined; streakCount: number; translateY: Animated.Value;
}) {
  if (!habit) return null;
  return (
    <Animated.View style={[styles.toast, { transform: [{ translateY }] }]}>
      <View style={styles.toastFlame}>
        <FlameIcon size={18} />
      </View>
      <View style={styles.toastText}>
        <Text style={styles.toastName} numberOfLines={1}>{habit.name}</Text>
        <Text style={styles.toastStreak}>{streakCount} day streak 🔥</Text>
      </View>
    </Animated.View>
  );
}

function CelebrationBanner({ habits, completions }: { habits: Habit[]; completions: Completion[] }) {
  return (
    <View style={styles.celebBanner}>
      <View style={styles.celebFlameCircle}>
        <FlameIcon size={28} />
      </View>
      <Text style={styles.celebTitle}>Perfect Day!</Text>
      <Text style={styles.celebSub}>All habits done for today. Keep the chain alive!</Text>
      <View style={styles.celebPills}>
        {habits.map((h) => (
          <View key={h.id} style={styles.celebPill}>
            <Text style={styles.celebPillEmoji}>{h.emoji}</Text>
            <Text style={styles.celebPillText}>{getStreakCount(h.id, completions)}d</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#FF740D', '#FFD700', '#FF3B30', '#34C759', '#FFFFFF'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const addHabit = useHabitStore((s) => s.addHabit);
  const toggleCompletion = useHabitStore((s) => s.toggleCompletion);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [toastHabitId, setToastHabitId] = useState<string | null>(null);

  const toastY = useRef(new Animated.Value(-90)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(8)).current;
  const fabScale = useRef(new Animated.Value(0.7)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const confettiPieces = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }))
  ).current;

  const today = getTodayDateString();
  const completedIds = useMemo(
    () => new Set(completions.filter((c) => c.date === today).map((c) => c.habitId)),
    [completions, today]
  );
  const doneCount = completedIds.size;
  const totalCount = habits.length;

  const screenState: ScreenState =
    totalCount === 0 ? 'empty' :
    doneCount === totalCount ? 'all-complete' :
    'some-incomplete';

  const prevScreenState = useRef<ScreenState>(screenState);

  const listData: ListItem[] = useMemo(() => {
    if (totalCount === 0) return [];
    const incomplete = habits.filter((h) => !completedIds.has(h.id));
    const completed = habits.filter((h) => completedIds.has(h.id));
    const items: ListItem[] = incomplete.map((h) => ({ type: 'habit' as const, habit: h, isCompleted: false, dimmed: false }));
    if (completed.length > 0 && incomplete.length > 0) items.push({ type: 'divider' });
    completed.forEach((h) => items.push({ type: 'habit', habit: h, isCompleted: true, dimmed: incomplete.length > 0 }));
    if (screenState === 'all-complete') items.push({ type: 'celebration' });
    return items;
  }, [habits, completedIds, screenState, totalCount]);

  // Mount animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 400, delay: 60, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(headerY, { toValue: 0, duration: 400, delay: 60, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(fabScale, { toValue: 1.08, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(fabScale, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // Progress bar sync (useNativeDriver: false — layout prop)
  useEffect(() => {
    const ratio = totalCount > 0 ? doneCount / totalCount : 0;
    Animated.timing(progressAnim, { toValue: ratio, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: false }).start();
  }, [doneCount, totalCount]);

  // Confetti
  const burstConfetti = useCallback(() => {
    confettiPieces.forEach((piece, i) => {
      const angle = (i / confettiPieces.length) * Math.PI * 2;
      const dist = 90 + (i % 3) * 30;
      piece.x.setValue(0); piece.y.setValue(0); piece.opacity.setValue(1);
      Animated.parallel([
        Animated.timing(piece.x, { toValue: Math.cos(angle) * dist, duration: 700, useNativeDriver: true }),
        Animated.timing(piece.y, { toValue: Math.sin(angle) * dist - 60, duration: 700, useNativeDriver: true }),
        Animated.timing(piece.opacity, { toValue: 0, duration: 700, delay: 280, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  useEffect(() => {
    if (screenState === 'all-complete' && prevScreenState.current !== 'all-complete') burstConfetti();
    prevScreenState.current = screenState;
  }, [screenState, burstConfetti]);

  // Toast
  const showToast = useCallback((habitId: string) => {
    setToastHabitId(habitId);
    toastY.setValue(-90);
    Animated.timing(toastY, { toValue: 0, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastY, { toValue: -90, duration: 260, useNativeDriver: true }).start(() => setToastHabitId(null));
    }, 3400);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const handleToggle = useCallback((habitId: string) => {
    const wasCompleted = completedIds.has(habitId);
    toggleCompletion(habitId, today);
    if (!wasCompleted) showToast(habitId);
  }, [completedIds, today, toggleCompletion, showToast]);

  const renderItem: ListRenderItem<ListItem> = useCallback(({ item }) => {
    if (item.type === 'divider') return <SectionDivider isDark={isDark} />;
    if (item.type === 'celebration') return <CelebrationBanner habits={habits} completions={completions} />;
    const habitIdx = habits.findIndex((h) => h.id === item.habit.id);
    return (
      <HabitCard
        habit={item.habit}
        isCompleted={item.isCompleted}
        streakCount={getStreakCount(item.habit.id, completions)}
        onToggle={() => handleToggle(item.habit.id)}
        entranceIndex={habitIdx}
        dimmed={item.dimmed}
      />
    );
  }, [habits, completions, isDark, handleToggle]);

  const bg = isDark ? '#1A1A1A' : '#FFFFFF';
  const headerNameColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const sectionLabelColor = isDark ? '#555555' : '#C5BFB8';

  const toastHabit = habits.find((h) => h.id === toastHabitId);
  const toastStreak = toastHabitId ? getStreakCount(toastHabitId, completions) : 0;

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>

      {/* Header */}
      <Animated.View
        style={[
          styles.screenHeader,
          { paddingTop: insets.top + 10 },
          { opacity: headerFade, transform: [{ translateY: headerY }] },
        ]}
      >
        <View>
          {totalCount > 0 && (
            <Text style={[styles.sectionLabel, { color: sectionLabelColor }]}>
              TODAY — {totalCount} {totalCount === 1 ? 'HABIT' : 'HABITS'}
            </Text>
          )}
          <Text style={[styles.greeting, { color: headerNameColor }]}>Good morning 👋</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>L</Text>
        </View>
      </Animated.View>

      {/* List */}
      <FlatList
        data={listData}
        keyExtractor={(item, index) => item.type === 'habit' ? item.habit.id : `${item.type}-${index}`}
        renderItem={renderItem}
        ListHeaderComponent={totalCount > 0 ? (
          <ProgressCard doneCount={doneCount} totalCount={totalCount} progressAnim={progressAnim} isDark={isDark} />
        ) : null}
        ListEmptyComponent={<EmptyState isDark={isDark} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      />

      {/* Toast */}
      <ToastBanner habit={toastHabit} streakCount={toastStreak} translateY={toastY} />

      {/* Confetti overlay */}
      <View style={[StyleSheet.absoluteFill, styles.confettiOverlay]} pointerEvents="none">
        {confettiPieces.map((piece, i) => (
          <Animated.View
            key={i}
            style={[
              styles.confettiPiece,
              {
                backgroundColor: piece.color,
                opacity: piece.opacity,
                left: '50%',
                top: '25%',
                transform: [{ translateX: piece.x }, { translateY: piece.y }],
              },
            ]}
          />
        ))}
      </View>

      {/* FAB */}
      <Animated.View style={[styles.fabWrap, { bottom: insets.bottom + 72, transform: [{ scale: fabScale }] }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSheetVisible(true);
          }}
          style={styles.fab}
        >
          <PlusIcon size={26} />
        </Pressable>
      </Animated.View>

      {/* Sheet */}
      <AddHabitSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} onAdd={addHabit} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  screenHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sectionLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.9,
    marginBottom: 4,
  },
  greeting: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    lineHeight: 28,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#FF740D',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'DMSans_700Bold', fontSize: 16, color: '#FFFFFF',
  },

  listContent: { paddingTop: 4, flexGrow: 1 },

  progressCard: {
    marginHorizontal: 20, marginBottom: 16,
    borderRadius: 16, borderWidth: 1.5, padding: 14, gap: 10,
  },
  progressTop: { gap: 3 },
  progressCount: { fontFamily: 'DMSans_700Bold', fontSize: 14 },
  progressStatus: { fontFamily: 'DMSans_400Regular', fontSize: 12.5 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: '#FF740D' },

  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 60, paddingHorizontal: 40,
  },
  emptyIconWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  emptyFlame: { position: 'absolute' },
  emptyTitle: {
    fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22,
    marginTop: 20, textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: 'DMSans_400Regular', fontSize: 14,
    lineHeight: 22, textAlign: 'center', marginTop: 8,
  },

  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginVertical: 8, gap: 10,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontFamily: 'DMSans_500Medium', fontSize: 11 },

  toast: {
    position: 'absolute', top: 0, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,116,13,0.18)',
    padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 16, elevation: 6, zIndex: 100,
  },
  toastFlame: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFF0E0',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  toastText: { flex: 1 },
  toastName: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: '#FF740D' },
  toastStreak: { fontFamily: 'DMSans_400Regular', fontSize: 11.5, color: '#A89F95', marginTop: 1 },

  celebBanner: {
    marginHorizontal: 20, marginTop: 16, marginBottom: 8,
    borderRadius: 20, backgroundColor: '#FF740D',
    padding: 20, alignItems: 'center', gap: 8,
    shadowColor: '#FF6500', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 12, elevation: 6,
  },
  celebFlameCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  celebTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: '#FFFFFF' },
  celebSub: {
    fontFamily: 'DMSans_400Regular', fontSize: 13.5,
    color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20,
  },
  celebPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, justifyContent: 'center' },
  celebPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4,
  },
  celebPillEmoji: { fontSize: 14 },
  celebPillText: { fontFamily: 'DMSans_700Bold', fontSize: 11.5, color: '#FFFFFF' },

  confettiOverlay: { zIndex: 50 },
  confettiPiece: { position: 'absolute', width: 8, height: 8, borderRadius: 2 },

  fabWrap: { position: 'absolute', right: 20 },
  fab: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF740D',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF6500', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.50, shadowRadius: 10, elevation: 6,
  },
});
