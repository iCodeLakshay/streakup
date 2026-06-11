/**
 * utils/achievements.ts — badge derivation for the Achievements screen.
 *
 * Badges are derived from live streak data on every render — no persistence.
 * The moment any habit's best streak crosses a threshold the badge flips to
 * earned, keeping badges perfectly aligned with the user's streaks.
 */
import type { Habit, Completion, Freeze } from '@/stores/habitStore';
import { getBestStreak, getStreakCount } from '@/utils/streak';
import type { BadgeId } from '@/components/badges/BadgeMedals';

export interface EarnedBadge {
  id: BadgeId;
  label: string;
  theme: string;
  description: string;
  earned: boolean;
  progress: number;   // current value toward the threshold (capped at threshold)
  threshold: number;  // days for streak badges; 1 for perfect-day
  earnedBy?: string;  // habit name that owns the qualifying streak
}

interface StreakBadgeDef {
  id: BadgeId;
  label: string;
  theme: string;
  threshold: number;
}

// Order matters — drives the grid layout and "next badge" progress display.
const STREAK_BADGES: StreakBadgeDef[] = [
  { id: 'streak-7',   label: 'One Week',     theme: 'Bronze',  threshold: 7 },
  { id: 'streak-15',  label: 'Two Weeks',    theme: 'Silver',  threshold: 15 },
  { id: 'streak-30',  label: 'One Month',    theme: 'Gold',    threshold: 30 },
  { id: 'streak-50',  label: 'Halfway Hero', theme: 'Emerald', threshold: 50 },
  { id: 'streak-100', label: 'Centurion',    theme: 'Ruby',    threshold: 100 },
  { id: 'streak-365', label: 'Year of Fire', theme: 'Diamond', threshold: 365 },
];

/** Best streak across all habits, plus which habit owns it. */
function globalBestStreak(
  habits: Habit[],
  completions: Completion[],
  freezes: Freeze[]
): { best: number; owner?: string } {
  let best = 0;
  let owner: string | undefined;
  for (const h of habits) {
    const b = getBestStreak(h.id, completions, freezes);
    if (b > best) {
      best = b;
      owner = h.name;
    }
  }
  return { best, owner };
}

/** Highest currently-active streak across all habits. */
function globalCurrentStreak(
  habits: Habit[],
  completions: Completion[],
  freezes: Freeze[]
): number {
  let current = 0;
  for (const h of habits) {
    const c = getStreakCount(h.id, completions, freezes);
    if (c > current) current = c;
  }
  return current;
}

/** Whether any single date had every habit completed. */
function hadPerfectDay(habits: Habit[], completions: Completion[]): boolean {
  if (habits.length === 0) return false;
  const counts: Record<string, number> = {};
  for (const c of completions) {
    counts[c.date] = (counts[c.date] ?? 0) + 1;
  }
  return Object.values(counts).some((v) => v >= habits.length);
}

/** Build the full badge list (Perfect Day first, then streak milestones). */
export function buildStreakBadges(
  habits: Habit[],
  completions: Completion[],
  freezes: Freeze[]
): EarnedBadge[] {
  const { best, owner } = globalBestStreak(habits, completions, freezes);
  const perfect = hadPerfectDay(habits, completions);

  const perfectBadge: EarnedBadge = {
    id: 'perfect-day',
    label: 'Perfect Day',
    theme: 'Royal Gold',
    description: 'Completed all habits in a single day',
    earned: perfect,
    progress: perfect ? 1 : 0,
    threshold: 1,
  };

  const streakBadges: EarnedBadge[] = STREAK_BADGES.map((b) => {
    const earned = best >= b.threshold;
    return {
      id: b.id,
      label: b.label,
      theme: b.theme,
      description: `${b.threshold}-day streak on any habit`,
      earned,
      progress: Math.min(best, b.threshold),
      threshold: b.threshold,
      earnedBy: earned ? owner : undefined,
    };
  });

  return [perfectBadge, ...streakBadges];
}

/** Numbers for the "Longest Streak" hero card. */
export function getLongestStreakStats(
  habits: Habit[],
  completions: Completion[],
  freezes: Freeze[]
): { best: number; current: number } {
  return {
    best: globalBestStreak(habits, completions, freezes).best,
    current: globalCurrentStreak(habits, completions, freezes),
  };
}
