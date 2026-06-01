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
import {
  getTodayDateString,
  getYesterdayDateString,
} from '@/utils/date';

// Re-export for back-compat: many screens import these from this file.
export { getTodayDateString, getYesterdayDateString } from '@/utils/date';

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
    const prevCompletions = completions;

    if (existing) {
      set((state) => ({
        completions: state.completions.filter(
          (c) => !(c.habitId === habitId && c.date === date)
        ),
      }));
      try {
        await removeCompletion(habitId, date);
      } catch {
        set({ completions: prevCompletions });
        return;
      }
      if (serverId) syncCompletionRemove(serverId, date);
    } else {
      const completion: Completion = { id: `${habitId}-${date}`, habitId, date };
      set((state) => ({ completions: [...state.completions, completion] }));
      try {
        await addCompletion(completion);
      } catch {
        set({ completions: prevCompletions });
        return;
      }
      if (serverId) syncCompletionAdd(serverId, date);
    }

    // Re-derive reminders from the latest completion state. Dynamic import
    // avoids an import cycle (notifications.ts statically imports this store).
    import('@/utils/notifications').then((m) => m.rescheduleNotifications()).catch(() => {});
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

// ── Streak utilities (extracted to utils/streak.ts) ──────────────────────────
// Re-export everything so existing consumers keep working unchanged.

export { getTodayCompletions, getStreakCount, getBestStreak, getThisMonthDisplay, getAllTimeCount, getWeekStatus } from '@/utils/streak';
export type { WeekDay } from '@/utils/streak';
