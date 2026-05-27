import { useMemo } from 'react';
import {
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  useHabitStore,
  getTodayDateString,
  getStreakCount,
  getBestStreak,
} from '@/stores/habitStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function offsetDate(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

const DAY_LABELS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS_MINI  = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function StatsScreen() {
  const insets   = useSafeAreaInsets();
  const isDark   = useColorScheme() === 'dark';
  const habits      = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const freezes     = useHabitStore((s) => s.freezes);

  // ── Colors ─────────────────────────────────────────────────────────────────
  const bg       = isDark ? '#1F1D1B' : '#FAFAF8';
  const surface1 = isDark ? '#2A2826' : '#F5F3F0';
  const surface2 = isDark ? '#333130' : '#EEECEA';
  const border   = isDark ? '#3A3835' : '#E8E5E0';
  const textPri  = isDark ? '#F5F3F0' : '#1F1D1B';
  const textSec  = isDark ? '#8A8780' : '#7A776F';
  const textMut  = isDark ? '#6A6762' : '#B8B5AE';

  // ── Summary metrics ─────────────────────────────────────────────────────────
  const today = getTodayDateString();
  const todayCount = useMemo(
    () => completions.filter((c) => c.date === today).length,
    [completions, today]
  );

  const overallBest = useMemo(
    () => habits.reduce((max, h) => Math.max(max, getBestStreak(h.id, completions, freezes)), 0),
    [habits, completions]
  );

  const now = new Date();
  const weekStartDate = (() => {
    const d = new Date(now);
    const dow = d.getDay();
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const thisWeekActiveDays = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const ds = getLocalDateString(offsetDate(weekStartDate, i));
      if (ds > today) break;
      if (completions.some((c) => c.date === ds)) count++;
    }
    return count;
  }, [completions, weekStartDate, today]);

  // ── Weekly bar chart (last 7 days) ─────────────────────────────────────────
  const weekBars = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = offsetDate(now, i - 6);
      const ds = getLocalDateString(d);
      const count = completions.filter((c) => c.date === ds).length;
      const isFuture = ds > today;
      const isToday = ds === today;
      const dow = d.getDay(); // 0=Sun
      const label = DAY_LABELS_SHORT[(dow + 6) % 7]; // shift so 0=Mon
      return { ds, count, isFuture, isToday, label };
    });
  }, [completions, today]);

  const maxBar = Math.max(...weekBars.map((b) => b.count), 1);

  // ── Monthly heatmap ─────────────────────────────────────────────────────────
  const monthData = useMemo(() => {
    const year  = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
    const offsetToMon = (firstDow + 6) % 7; // how many blank cells before day 1
    const totalHabits = habits.length;

    return { year, month, daysInMonth, offsetToMon, totalHabits };
  }, [now, habits]);

  function heatmapColor(day: number): string {
    const ds = `${monthData.year}-${String(monthData.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isFuture = ds > today;
    if (isFuture) return 'transparent';
    const count = completions.filter((c) => c.date === ds).length;
    if (count === 0) return isDark ? '#333130' : '#EEECEA';
    if (monthData.totalHabits === 0) return isDark ? '#1A3A28' : '#BBF7D0';
    const ratio = count / monthData.totalHabits;
    if (ratio >= 1)   return isDark ? '#166534' : '#22C55E';
    if (ratio >= 0.5) return isDark ? '#1A3A28' : '#86EFAC';
    return isDark ? '#14261D' : '#BBF7D0';
  }

  // ── Per-habit leaderboard ───────────────────────────────────────────────────
  const habitLeaderboard = useMemo(() => {
    return habits
      .map((h) => ({
        ...h,
        streak: getStreakCount(h.id, completions, freezes),
        best: getBestStreak(h.id, completions, freezes),
        total: completions.filter((c) => c.habitId === h.id).length,
      }))
      .sort((a, b) => b.streak - a.streak);
  }, [habits, completions]);

  const hasData = habits.length > 0;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: bg }]}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPri }]}>Stats</Text>
        <Text style={[styles.subtitle, { color: textSec }]}>
          {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
        </Text>
      </View>

      {/* Summary row */}
      <View style={[styles.summaryRow, { borderColor: border }]}>
        <View style={[styles.summaryCard, { backgroundColor: surface1, borderColor: border }]}>
          <Text style={[styles.summaryValue, { color: textPri }]}>
            {todayCount}<Text style={[styles.summaryDenom, { color: textMut }]}>/{habits.length}</Text>
          </Text>
          <Text style={[styles.summaryLabel, { color: textMut }]}>TODAY</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: surface1, borderColor: border }]}>
          <Text style={[styles.summaryValue, { color: textPri }]}>{thisWeekActiveDays}</Text>
          <Text style={[styles.summaryLabel, { color: textMut }]}>THIS WEEK</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: surface1, borderColor: border }]}>
          <Text style={[styles.summaryValue, { color: textPri }]}>{overallBest}</Text>
          <Text style={[styles.summaryLabel, { color: textMut }]}>BEST STREAK</Text>
        </View>
      </View>

      {/* Weekly bar chart */}
      <View style={[styles.section, { backgroundColor: surface1, borderColor: border }]}>
        <Text style={[styles.sectionLabel, { color: textMut }]}>LAST 7 DAYS</Text>
        {hasData ? (
          <View style={styles.barChart}>
            {weekBars.map((bar) => {
              const fillRatio = bar.isFuture ? 0 : bar.count / maxBar;
              const barColor = bar.count > 0 ? '#22C55E' : (isDark ? '#3A3835' : '#E8E5E0');
              return (
                <View key={bar.ds} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.max(fillRatio * 100, bar.count > 0 ? 8 : 0)}%`,
                          backgroundColor: barColor,
                          opacity: bar.isFuture ? 0 : 1,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[
                    styles.barLabel,
                    { color: bar.isToday ? textPri : textMut, fontFamily: bar.isToday ? 'DMSans_700Bold' : 'DMSans_400Regular' },
                  ]}>
                    {bar.label}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.emptyHint, { color: textMut }]}>Add habits to see your weekly activity.</Text>
        )}
      </View>

      {/* Monthly heatmap */}
      <View style={[styles.section, { backgroundColor: surface1, borderColor: border }]}>
        <Text style={[styles.sectionLabel, { color: textMut }]}>
          {MONTH_NAMES[monthData.month].toUpperCase()}
        </Text>
        {/* Day-of-week headers */}
        <View style={styles.heatmapRow}>
          {DAY_LABELS_MINI.map((l, i) => (
            <Text key={i} style={[styles.heatmapDowLabel, { color: textMut }]}>{l}</Text>
          ))}
        </View>
        {/* Calendar grid */}
        <View style={styles.heatmapGrid}>
          {Array.from({ length: monthData.offsetToMon }).map((_, i) => (
            <View key={`blank-${i}`} style={styles.heatCell} />
          ))}
          {Array.from({ length: monthData.daysInMonth }, (_, i) => i + 1).map((day) => {
            const ds = `${monthData.year}-${String(monthData.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isFuture = ds > today;
            const isToday  = ds === today;
            const color    = heatmapColor(day);
            return (
              <View
                key={day}
                style={[
                  styles.heatCell,
                  {
                    backgroundColor: color,
                    borderWidth: isToday ? 1.5 : 0,
                    borderColor: isToday ? '#FF740D' : 'transparent',
                    opacity: isFuture ? 0.3 : 1,
                  },
                ]}
              >
                <Text style={[styles.heatCellText, { color: isDark ? '#8A8780' : '#B8B5AE' }]}>
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
        {/* Legend */}
        <View style={styles.legendRow}>
          <Text style={[styles.legendLabel, { color: textMut }]}>Less</Text>
          {[isDark ? '#333130' : '#EEECEA', isDark ? '#14261D' : '#BBF7D0', isDark ? '#1A3A28' : '#86EFAC', isDark ? '#166534' : '#22C55E'].map((c, i) => (
            <View key={i} style={[styles.legendDot, { backgroundColor: c }]} />
          ))}
          <Text style={[styles.legendLabel, { color: textMut }]}>More</Text>
        </View>
      </View>

      {/* Per-habit leaderboard */}
      {habitLeaderboard.length > 0 && (
        <View style={[styles.section, { backgroundColor: surface1, borderColor: border }]}>
          <Text style={[styles.sectionLabel, { color: textMut }]}>HABIT STREAKS</Text>
          {habitLeaderboard.map((h, idx) => (
            <View
              key={h.id}
              style={[
                styles.leaderRow,
                idx < habitLeaderboard.length - 1 && { borderBottomWidth: 1, borderBottomColor: border },
              ]}
            >
              <Text style={styles.leaderEmoji}>{h.emoji}</Text>
              <View style={styles.leaderInfo}>
                <Text style={[styles.leaderName, { color: textPri }]} numberOfLines={1}>{h.name}</Text>
                <Text style={[styles.leaderSub, { color: textSec }]}>
                  {h.total} total · best {h.best}d
                </Text>
              </View>
              <View style={styles.leaderStreakWrap}>
                <Text style={styles.leaderFlame}>🔥</Text>
                <Text style={[styles.leaderStreak, { color: textPri }]}>{h.streak}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Empty state */}
      {!hasData && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={[styles.emptyTitle, { color: textPri }]}>No habits yet</Text>
          <Text style={[styles.emptyBody, { color: textSec }]}>
            Add your first habit on the Home tab and start building streaks.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  header: { marginBottom: 20 },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    marginTop: 2,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    lineHeight: 26,
  },
  summaryDenom: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
  },
  summaryLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 9.5,
    letterSpacing: 0.7,
  },

  section: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
    gap: 14,
  },
  sectionLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
  },

  // Bar chart
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 6,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10.5,
  },

  emptyHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },

  // Heatmap
  heatmapRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  heatmapDowLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 0.4,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  heatCell: {
    width: `${(100 - 6 * 4 / 3) / 7}%`,
    aspectRatio: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatCellText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 9,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
  },
  legendLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },

  // Leaderboard
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  leaderEmoji: {
    fontSize: 26,
    width: 36,
    textAlign: 'center',
  },
  leaderInfo: {
    flex: 1,
    gap: 2,
  },
  leaderName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  leaderSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
  },
  leaderStreakWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  leaderFlame: { fontSize: 14 },
  leaderStreak: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    minWidth: 28,
    textAlign: 'right',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
    gap: 10,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
  },
  emptyBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
