import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useHabitStore } from '@/stores/habitStore';
import { BadgeMedal } from '@/components/badges/BadgeMedals';
import {
  buildStreakBadges,
  getLongestStreakStats,
  type EarnedBadge,
} from '@/utils/achievements';

const PRIMARY = '#FF740D';

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';

  const habits      = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const freezes     = useHabitStore((s) => s.freezes);

  const badges = useMemo(
    () => buildStreakBadges(habits, completions, freezes),
    [habits, completions, freezes]
  );
  const stats = useMemo(
    () => getLongestStreakStats(habits, completions, freezes),
    [habits, completions, freezes]
  );

  const earned = badges.filter((b) => b.earned).length;

  // Show progress only on the first not-yet-earned streak badge (the "next" one).
  const nextBadgeId = badges.find((b) => !b.earned && b.id !== 'perfect-day')?.id;

  // ── Theme tokens ──
  const bg          = isDark ? '#1F1D1B' : '#FAFAF8';
  const textPrimary = isDark ? '#F5F3F0' : '#1F1D1B';
  const textMuted   = isDark ? '#8A8780' : '#9B978F';
  const eyebrow     = isDark ? '#6A6762' : '#B8B5AE';
  const heroBg      = isDark ? '#2A211A' : '#FFF4EC';
  const heroBorder  = isDark ? '#3E2F22' : '#FFE2CC';
  const pillBg      = isDark ? '#2A2826' : '#FFFFFF';
  const pillBorder  = isDark ? '#3A3835' : '#F0EDE8';

  const renderBadge = (b: EarnedBadge) => {
    const showProgress = b.id === nextBadgeId;
    return (
      <View key={b.id} style={styles.cell}>
        <BadgeMedal id={b.id} size={84} locked={!b.earned} />
        <Text
          style={[
            styles.badgeLabel,
            { color: b.earned ? textPrimary : textMuted },
          ]}
          numberOfLines={1}
        >
          {b.label}
        </Text>
        {showProgress ? (
          <Text style={styles.progressText}>
            {b.progress}/{b.threshold} days
          </Text>
        ) : (
          <View style={styles.progressSpacer} />
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: eyebrow }]}>Your milestones</Text>
          <Text style={[styles.title, { color: textPrimary }]}>Achievements</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
          <Text style={styles.pillEmoji}>🏅</Text>
          <Text style={[styles.pillText, { color: textPrimary }]}>
            {earned}/{badges.length}
          </Text>
        </View>
      </View>

      {/* Longest Streak hero card */}
      <View style={[styles.hero, { backgroundColor: heroBg, borderColor: heroBorder }]}>
        <View style={styles.heroEmblem}>
          <Text style={styles.heroFlame}>🔥</Text>
        </View>
        <View style={styles.heroInfo}>
          <Text style={[styles.heroLabel, { color: textMuted }]}>LONGEST STREAK</Text>
          <View style={styles.heroNumRow}>
            <Text style={[styles.heroNum, { color: textPrimary }]}>{stats.best}</Text>
            <Text style={[styles.heroUnit, { color: PRIMARY }]}>days</Text>
          </View>
          {stats.current > 0 && (
            <Text style={[styles.heroSub, { color: textMuted }]}>
              🔥 {stats.current}-day streak going right now
            </Text>
          )}
        </View>
      </View>

      {/* Streak milestones */}
      <Text style={[styles.sectionLabel, { color: eyebrow }]}>STREAK MILESTONES</Text>

      {earned === 0 && (
        <Text style={[styles.emptyHint, { color: textMuted }]}>
          Start a streak to earn your first badge.
        </Text>
      )}

      <View style={styles.grid}>{badges.map(renderBadge)}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerText: {
    gap: 2,
    flex: 1,
  },
  eyebrow: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 30,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 6,
  },
  pillEmoji: { fontSize: 14 },
  pillText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
  },

  // Hero
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 26,
  },
  heroEmblem: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  heroFlame: { fontSize: 30 },
  heroInfo: { flex: 1, gap: 2 },
  heroLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 1,
  },
  heroNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  heroNum: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 38,
    lineHeight: 42,
  },
  heroUnit: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  heroSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    marginTop: 2,
  },

  // Section
  sectionLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  emptyHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    marginBottom: 16,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: 22,
    gap: 6,
  },
  badgeLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    textAlign: 'center',
  },
  progressText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: PRIMARY,
    textAlign: 'center',
  },
  progressSpacer: {
    height: 15,
  },
});
