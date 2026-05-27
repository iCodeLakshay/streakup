import { create } from 'zustand';
import {
  getAllHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  getAllCompletions,
  addCompletion,
  removeCompletion,
  getAllFreezes,
  insertFreeze,
} from '@/services/habitService';
import {
  createHabitOnServer,
  updateHabitOnServer,
  deleteHabitOnServer,
  syncCompletionAdd,
  syncCompletionRemove,
} from '@/services/syncService';

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  serverId?: string;
}

export interface Completion {
  id: string;
  habitId: string;
  date: string; // 'YYYY-MM-DD'
}

export interface Freeze {
  id: string;
  habitId: string;
  date: string; // 'YYYY-MM-DD'
}

interface HabitStore {
  habits: Habit[];
  completions: Completion[];
  freezes: Freeze[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addHabit: (h: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'serverId'>) => Promise<void>;
  editHabit: (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'serverId'>>) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string, date: string) => Promise<void>;
  useFreeze: (habitId: string, date: string) => Promise<void>;
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  completions: [],
  freezes: [],
  isHydrated: false,

  hydrate: async () => {
    try {
      const [habits, completions, freezes] = await Promise.all([
        getAllHabits(),
        getAllCompletions(),
        getAllFreezes(),
      ]);
      set({ habits, completions, freezes, isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },

  addHabit: async (h) => {
    const now = new Date().toISOString();
    const habit: Habit = {
      ...h,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ habits: [...state.habits, habit] }));
    await createHabit(habit);
    createHabitOnServer(habit);
  },

  editHabit: async (id, updates) => {
    const updatedAt = new Date().toISOString();
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, ...updates, updatedAt } : h
      ),
    }));
    const habit = get().habits.find((h) => h.id === id);
    if (habit) {
      await updateHabit(habit);
      updateHabitOnServer(habit);
    }
  },

  removeHabit: async (id) => {
    const serverId = get().habits.find((h) => h.id === id)?.serverId;
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
      completions: state.completions.filter((c) => c.habitId !== id),
      freezes: state.freezes.filter((f) => f.habitId !== id),
    }));
    await deleteHabit(id);
    if (serverId) deleteHabitOnServer(serverId);
  },

  toggleCompletion: async (habitId, date) => {
    const { completions, habits } = get();
    const existing = completions.find((c) => c.habitId === habitId && c.date === date);
    const serverId = habits.find((h) => h.id === habitId)?.serverId;

    if (existing) {
      set((state) => ({
        completions: state.completions.filter(
          (c) => !(c.habitId === habitId && c.date === date)
        ),
      }));
      await removeCompletion(habitId, date);
      if (serverId) syncCompletionRemove(serverId, date);
    } else {
      const completion: Completion = { id: `${habitId}-${date}`, habitId, date };
      set((state) => ({ completions: [...state.completions, completion] }));
      await addCompletion(completion);
      if (serverId) syncCompletionAdd(serverId, date);
    }
  },

  useFreeze: async (habitId, date) => {
    const alreadyFrozen = get().freezes.some(
      (f) => f.habitId === habitId && f.date === date
    );
    if (alreadyFrozen) return;
    const freeze: Freeze = { id: `freeze-${habitId}-${date}`, habitId, date };
    set((state) => ({ freezes: [...state.freezes, freeze] }));
    await insertFreeze(freeze);
  },
}));

// ── Date utilities ────────────────────────────────────────────────────────────

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getTodayCompletions(completions: Completion[]): Completion[] {
  const today = getTodayDateString();
  return completions.filter((c) => c.date === today);
}

function offsetDateStr(from: string, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
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

export interface WeekDay {
  label: string;
  completed: boolean;
  isFrozen: boolean;
  isFuture: boolean;
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
  const dow = today.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

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
