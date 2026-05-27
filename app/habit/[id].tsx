import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, Modal, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  useHabitStore,
  getStreakCount,
  getBestStreak,
  getThisMonthDisplay,
  getAllTimeCount,
  getWeekStatus,
  getYesterdayDateString,
  type Habit,
} from '@/stores/habitStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { AddHabitSheet } from '@/components/AddHabitSheet';

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackChevron({ color }: { color: string }) {
  return (
    <Svg width={10} height={17} viewBox="0 0 10 17" fill="none">
      <Path d="M9 1L1 8.5L9 16" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PencilIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';

  const habit       = useHabitStore((s) => s.habits.find((h) => h.id === id));
  const completions = useHabitStore((s) => s.completions);
  const freezes     = useHabitStore((s) => s.freezes);
  const editHabit   = useHabitStore((s) => s.editHabit);
  const removeHabit = useHabitStore((s) => s.removeHabit);
  const useFreeze   = useHabitStore((s) => s.useFreeze);

  const freezeCount   = useSettingsStore((s) => s.freezeCount);
  const consumeFreeze = useSettingsStore((s) => s.consumeFreeze);

  const [showEdit, setShowEdit]               = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);

  // Entrance animation
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentY    = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (!habit) { router.back(); return; }
    Animated.parallel([
      Animated.timing(contentFade, {
        toValue: 1, duration: 320, delay: 60,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(contentY, {
        toValue: 0, duration: 320, delay: 60,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
    ]).start();
  }, [habit]);

  if (!habit) return null;

  // ── Data ──────────────────────────────────────────────────────────────────
  const currentStreak = getStreakCount(habit.id, completions, freezes);
  const bestStreak    = getBestStreak(habit.id, completions, freezes);
  const { completed: monthDone, daysPassed } = getThisMonthDisplay(habit.id, completions);
  const allTime  = getAllTimeCount(habit.id, completions);
  const weekDays = getWeekStatus(habit.id, completions, freezes);

  const yesterday = getYesterdayDateString();
  const todayCompleted = completions.some((c) => c.habitId === habit.id && c.date === new Date().toISOString().slice(0, 10));
  const yesterdayMissed =
    !completions.some((c) => c.habitId === habit.id && c.date === yesterday) &&
    !freezes.some((f) => f.habitId === habit.id && f.date === yesterday);
  const canFreeze = yesterdayMissed && currentStreak === 0 && freezeCount > 0 && !todayCompleted;

  // ── Colors ────────────────────────────────────────────────────────────────
  const bg           = isDark ? '#1F1D1B' : '#FAFAF8';
  const navBorder    = isDark ? '#3A3835' : '#F0EDE8';
  const heroBg       = isDark ? '#333130' : '#EEECEA';
  const heroBorder   = isDark ? '#3A3835' : '#E8E5E0';
  const emojiBg      = isDark ? '#2A2826' : '#F5F3F0';
  const statsDivider = isDark ? '#3A3835' : '#E8E5E0';
  const textPrimary  = isDark ? '#F5F3F0' : '#1F1D1B';
  const textSecondary = isDark ? '#8A8780' : '#7A776F';
  const textMuted    = isDark ? '#6A6762' : '#B8B5AE';
  const dayBoxDefault = isDark ? '#333130' : '#EEECEA';
  const deleteBorder  = isDark ? '#3A2020' : '#FEE2E2';
  const deleteBg      = isDark ? '#2A1A1A' : '#FFF5F5';

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSave = async (id: string, updates: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => {
    await editHabit(id, updates);
    setShowEdit(false);
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    await removeHabit(habit.id);
    router.back();
  };

  const handleFreeze = async () => {
    setShowFreezeModal(false);
    const ok = consumeFreeze();
    if (ok) await useFreeze(habit.id, yesterday);
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>

      {/* Nav bar */}
      <View style={[styles.navBar, { paddingTop: insets.top + 10, backgroundColor: bg, borderBottomColor: navBorder }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <BackChevron color={textSecondary} />
          <Text style={[styles.backLabel, { color: textSecondary }]}>Home</Text>
        </Pressable>
        <Text style={[styles.navTitle, { color: textPrimary }]} numberOfLines={1}>
          {habit.name}
        </Text>
        <Pressable style={styles.editButton} onPress={() => setShowEdit(true)} hitSlop={8}>
          <PencilIcon color={textSecondary} />
        </Pressable>
      </View>

      <Animated.ScrollView
        style={{ opacity: contentFade, transform: [{ translateY: contentY }] }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: heroBg, borderBottomColor: heroBorder }]}>
          <View style={[styles.heroEmoji, { backgroundColor: emojiBg }]}>
            <Text style={styles.heroEmojiText}>{habit.emoji}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={[styles.heroName, { color: textPrimary }]}>{habit.name}</Text>
            <View style={styles.heroStreak}>
              <Text style={styles.heroFlame}>🔥</Text>
              <Text style={[styles.heroStreakText, { color: textSecondary }]}>
                {currentStreak > 0 ? `${currentStreak} day streak` : 'Start your streak!'}
              </Text>
            </View>
            {habit.note ? (
              <Text style={[styles.heroNote, { color: textMuted }]} numberOfLines={2}>
                {habit.note}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { borderBottomColor: statsDivider }]}>
          <StatCell value={`${bestStreak}`} label="BEST" divider={statsDivider} textPrimary={textPrimary} textMuted={textMuted} showDivider />
          <StatCell value={`${monthDone}/${daysPassed}`} label="THIS MONTH" divider={statsDivider} textPrimary={textPrimary} textMuted={textMuted} showDivider />
          <StatCell value={`${allTime}`} label="ALL TIME" divider={statsDivider} textPrimary={textPrimary} textMuted={textMuted} showDivider={false} />
        </View>

        {/* Weekly grid */}
        <View style={styles.weekSection}>
          <Text style={[styles.weekLabel, { color: textMuted }]}>THIS WEEK</Text>
          <View style={styles.weekGrid}>
            {weekDays.map((day, i) => (
              <View key={i} style={styles.dayCol}>
                <View
                  style={[
                    styles.dayBox,
                    day.isFuture
                      ? { backgroundColor: dayBoxDefault, opacity: 0.4 }
                      : day.completed
                        ? styles.dayBoxDone
                        : day.isFrozen
                          ? styles.dayBoxFrozen
                          : { backgroundColor: dayBoxDefault },
                  ]}
                >
                  {day.completed && !day.isFuture && (
                    <CheckIcon color="#22C55E" size={12} />
                  )}
                  {day.isFrozen && !day.isFuture && (
                    <Text style={styles.frozenEmoji}>❄️</Text>
                  )}
                </View>
                <Text style={[styles.dayLabel, { color: textMuted }]}>{day.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Freeze zone */}
        {canFreeze && (
          <View style={[styles.freezeZone, { borderColor: isDark ? '#1E3A5F' : '#BFDBFE', backgroundColor: isDark ? '#0F2033' : '#EFF6FF' }]}>
            <View style={styles.freezeHeader}>
              <Text style={styles.freezeIcon}>❄️</Text>
              <View style={styles.freezeHeaderText}>
                <Text style={[styles.freezeTitle, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>Protect your streak</Text>
                <Text style={[styles.freezeSubtitle, { color: isDark ? '#60A5FA' : '#3B82F6' }]}>
                  {freezeCount} freeze{freezeCount !== 1 ? 's' : ''} remaining
                </Text>
              </View>
            </View>
            <Text style={[styles.freezeBody, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>
              You missed yesterday. Use a freeze to protect your streak.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.freezeBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setShowFreezeModal(true)}
            >
              <Text style={styles.freezeBtnText}>Use Freeze</Text>
            </Pressable>
          </View>
        )}

        {/* Freeze count chip (always visible when freezes available) */}
        {!canFreeze && freezeCount > 0 && (
          <View style={styles.freezeChipRow}>
            <View style={[styles.freezeChip, { borderColor: isDark ? '#1E3A5F' : '#BFDBFE', backgroundColor: isDark ? '#0F2033' : '#EFF6FF' }]}>
              <Text style={styles.freezeChipEmoji}>❄️</Text>
              <Text style={[styles.freezeChipText, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>
                {freezeCount} freeze{freezeCount !== 1 ? 's' : ''} available
              </Text>
            </View>
          </View>
        )}

        {/* Delete zone */}
        <View style={[styles.deleteZone, { borderColor: deleteBorder, backgroundColor: deleteBg }]}>
          <Pressable
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
            onPress={() => setShowDeleteModal(true)}
          >
            <Text style={styles.deleteBtnText}>Delete Habit</Text>
          </Pressable>
          <Text style={[styles.deleteHint, { color: textMuted }]}>
            This will permanently remove this habit and all its history.
          </Text>
        </View>

      </Animated.ScrollView>

      {/* Edit sheet */}
      <AddHabitSheet
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        habitToEdit={habit}
        onSave={handleSave}
      />

      {/* Freeze confirmation modal */}
      <Modal visible={showFreezeModal} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowFreezeModal(false)}>
          <Pressable style={[styles.confirmCard, { backgroundColor: isDark ? '#2A2826' : '#FFFFFF' }]}>
            <Text style={styles.freezeIcon}>❄️</Text>
            <Text style={[styles.confirmTitle, { color: textPrimary }]}>Use a streak freeze?</Text>
            <Text style={[styles.confirmBody, { color: textSecondary }]}>
              This will protect yesterday's streak. You have {freezeCount} freeze{freezeCount !== 1 ? 's' : ''} remaining. Freezes replenish weekly.
            </Text>
            <View style={styles.confirmButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmCancel,
                  { backgroundColor: isDark ? '#333130' : '#F5F3F0', borderColor: isDark ? '#3A3835' : '#E8E5E0' },
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() => setShowFreezeModal(false)}
              >
                <Text style={[styles.confirmCancelText, { color: textPrimary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.freezeBtn, { flex: 1 }, pressed && { opacity: 0.8 }]}
                onPress={handleFreeze}
              >
                <Text style={styles.freezeBtnText}>Use Freeze</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDeleteModal(false)}>
          <Pressable style={[styles.confirmCard, { backgroundColor: isDark ? '#2A2826' : '#FFFFFF' }]}>
            <Text style={[styles.confirmTitle, { color: textPrimary }]}>Delete "{habit.name}"?</Text>
            <Text style={[styles.confirmBody, { color: textSecondary }]}>
              All completion history for this habit will be permanently removed. This cannot be undone.
            </Text>
            <View style={styles.confirmButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmCancel,
                  { backgroundColor: isDark ? '#333130' : '#F5F3F0', borderColor: isDark ? '#3A3835' : '#E8E5E0' },
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={[styles.confirmCancelText, { color: textPrimary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.confirmDelete, pressed && { opacity: 0.8 }]}
                onPress={handleDelete}
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

// ─── StatCell ─────────────────────────────────────────────────────────────────

function StatCell({
  value, label, divider, textPrimary, textMuted, showDivider,
}: {
  value: string; label: string; divider: string;
  textPrimary: string; textMuted: string; showDivider: boolean;
}) {
  return (
    <View style={[styles.statCell, showDivider && { borderRightColor: divider, borderRightWidth: 1 }]}>
      <Text style={[styles.statValue, { color: textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: textMuted }]}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 64,
  },
  backLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  editButton: {
    minWidth: 64,
    alignItems: 'flex-end',
    paddingRight: 4,
  },

  scrollContent: { flexGrow: 1 },

  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderBottomWidth: 1,
  },
  heroEmoji: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroEmojiText: { fontSize: 28 },
  heroInfo: { flex: 1, gap: 5 },
  heroName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 19,
    lineHeight: 24,
  },
  heroStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroFlame: { fontSize: 15, lineHeight: 18 },
  heroStreakText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
  },
  heroNote: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },

  statsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  statCell: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  statLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 0.7,
  },

  weekSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 12,
  },
  weekLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  weekGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  dayBox: {
    width: '100%',
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBoxDone: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  dayBoxFrozen: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  frozenEmoji: {
    fontSize: 12,
  },
  dayLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
  },

  // Freeze zone
  freezeZone: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
  },
  freezeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  freezeIcon: { fontSize: 22 },
  freezeHeaderText: { flex: 1, gap: 2 },
  freezeTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  freezeSubtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  freezeBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  freezeBtn: {
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freezeBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Freeze chip
  freezeChipRow: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  freezeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  freezeChipEmoji: { fontSize: 13 },
  freezeChipText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },

  // Delete zone
  deleteZone: {
    marginHorizontal: 20,
    marginTop: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  deleteBtn: {
    paddingVertical: 4,
  },
  deleteBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: '#DC2626',
  },
  deleteHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },

  // Delete confirmation modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  confirmTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    lineHeight: 22,
  },
  confirmBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  confirmCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
  confirmDelete: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
