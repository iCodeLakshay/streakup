/**
 * utils/streak.ts — Streak calculation helpers for StreakUp.
 *
 * Extracted from stores/habitStore.ts so streak logic can be tested and
 * imported independently. All consumers that previously imported from
 * habitStore continue to work via re-exports there.
 */
import type { Completion, Freeze } from '@/stores/habitStore';
import {
  getTodayDateString,
  offsetDateStr,
  diffInDays,
  startOfWeekMonday,
} from '@/utils/date';

export interface WeekDay {
  label: string;
  completed: boolean;
  isFrozen: boolean;
  isFuture: boolean;
}

export function getTodayCompletions(completions: Completion[]): Completion[] {
  const today = getTodayDateString();
  return completions.filter((c) => c.date === today);
}

export function getStreakCount(
  habitId: string,
  completions: Completion[],
  freezes: Freeze[] = []
): number {
  const today = getTodayDateString();
  const dates = new Set([
    ...completions.filter((c) => c.habitId === habitId).map((c) => c.date),
    ...freezes.filter((f) => f.habitId === habitId).map((f) => f.date),
  ]);
  const startCursor = dates.has(today) ? today : offsetDateStr(today, -1);
  let streak = 0;
  let cursor = startCursor;
  while (dates.has(cursor)) {
    streak++;
    cursor = offsetDateStr(cursor, -1);
  }
  return streak;
}

export function getBestStreak(
  habitId: string,
  completions: Completion[],
  freezes: Freeze[] = []
): number {
  const sorted = [
    ...completions.filter((c) => c.habitId === habitId).map((c) => c.date),
    ...freezes.filter((f) => f.habitId === habitId).map((f) => f.date),
  ]
    .filter((v, i, a) => a.indexOf(v) === i) // dedupe
    .sort();
  if (sorted.length === 0) return 0;
  let best = 1, current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = diffInDays(sorted[i], sorted[i - 1]);
    if (diff === 1) { current++; if (current > best) best = current; }
    else current = 1;
  }
  return best;
}

export function getThisMonthDisplay(
  habitId: string,
  completions: Completion[]
): { completed: number; daysPassed: number } {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const completed = completions.filter(
    (c) => c.habitId === habitId && c.date.startsWith(prefix)
  ).length;
  return { completed, daysPassed: now.getDate() };
}

export function getAllTimeCount(habitId: string, completions: Completion[]): number {
  return completions.filter((c) => c.habitId === habitId).length;
}

export function getWeekStatus(
  habitId: string,
  completions: Completion[],
  freezes: Freeze[] = []
): WeekDay[] {
  const completedDates = new Set(
    completions.filter((c) => c.habitId === habitId).map((c) => c.date)
  );
  const frozenDates = new Set(
    freezes.filter((f) => f.habitId === habitId).map((f) => f.date)
  );
  const today = new Date();
  const todayStr = getTodayDateString();
  const monday = startOfWeekMonday(today);

  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      label,
      completed: completedDates.has(dateStr),
      isFrozen: frozenDates.has(dateStr) && !completedDates.has(dateStr),
      isFuture: dateStr > todayStr,
    };
  });
}
