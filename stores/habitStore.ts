import { create } from 'zustand';

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  note: string | null;
  createdAt: string;
}

export interface Completion {
  habitId: string;
  date: string; // 'YYYY-MM-DD'
}

interface HabitStore {
  habits: Habit[];
  completions: Completion[];
  addHabit: (h: Omit<Habit, 'id' | 'createdAt'>) => void;
  toggleCompletion: (habitId: string, date: string) => void;
}

export const useHabitStore = create<HabitStore>((set) => ({
  habits: [],
  completions: [],

  addHabit: (h) =>
    set((state) => ({
      habits: [
        ...state.habits,
        { ...h, id: Date.now().toString(), createdAt: new Date().toISOString() },
      ],
    })),

  toggleCompletion: (habitId, date) =>
    set((state) => {
      const exists = state.completions.some(
        (c) => c.habitId === habitId && c.date === date
      );
      return {
        completions: exists
          ? state.completions.filter((c) => !(c.habitId === habitId && c.date === date))
          : [...state.completions, { habitId, date }],
      };
    }),
}));

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getTodayCompletions(completions: Completion[]): Completion[] {
  const today = getTodayDateString();
  return completions.filter((c) => c.date === today);
}

function getDateString(offsetDays: number, from?: string): string {
  const d = from ? new Date(from) : new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function getStreakCount(habitId: string, completions: Completion[]): number {
  const today = getTodayDateString();
  const dates = new Set(
    completions.filter((c) => c.habitId === habitId).map((c) => c.date)
  );
  const isCompletedToday = dates.has(today);
  let streak = 0;
  let cursor = isCompletedToday ? today : getDateString(-1);
  while (dates.has(cursor)) {
    streak++;
    cursor = getDateString(-1, cursor);
  }
  return streak;
}
