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
  getWeekStartString,
} from '@/utils/date';
import { getStreakCount } from '@/utils/streak';

// Re-export for back-compat: many screens import these from this file.
export { getTodayDateString, getYesterdayDateString } from '@/utils/date';

export type TargetType = 'streak' | 'total' | 'weekdays' | 'weekly_frequency';

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  serverId?: string;
  targetType: TargetType;
  targetValue: number;
  targetCompletedAt: string | null;
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
  addHabit: (h: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'serverId' | 'targetType' | 'targetValue' | 'targetCompletedAt'> & {
    targetType?: TargetType;
    targetValue?: number;
    targetCompletedAt?: string | null;
  }) => Promise<void>;
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
      targetType: 'streak',
      targetValue: 30,
      targetCompletedAt: null,
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

// ── Target progress ───────────────────────────────────────────────────────────

export function getTargetProgress(
  habitId: string,
  completions: Completion[],
  freezes: Freeze[],
  habits: Habit[]
): { current: number; target: number; label: string; reached: boolean } {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return { current: 0, target: 0, label: '', reached: false };

  const { targetType, targetValue } = habit;

  if (targetType === 'total') {
    const current = completions.filter(c => c.habitId === habitId).length;
    return { current, target: targetValue, label: `${current} / ${targetValue} total`, reached: current >= targetValue };
  }

  if (targetType === 'weekdays') {
    // targetValue is a bitmask — count number of selected days
    const selectedCount = [0, 1, 2, 3, 4, 5, 6].filter(i => targetValue & (1 << i)).length;
    const current = getStreakCount(habitId, completions, freezes, { targetType, targetValue });
    const days = selectedCount === 1 ? 'day' : 'days';
    return { current, target: selectedCount, label: `${current} / ${selectedCount} ${days}`, reached: current >= selectedCount };
  }

  if (targetType === 'weekly_frequency') {
    const today = getTodayDateString();
    const weekStart = getWeekStartString();
    const thisWeekCompletions = completions.filter(
      c => c.habitId === habitId && c.date >= weekStart && c.date <= today
    ).length;
    return {
      current: thisWeekCompletions,
      target: targetValue,
      label: `${thisWeekCompletions} / ${targetValue} this week`,
      reached: thisWeekCompletions >= targetValue,
    };
  }

  // streak (default)
  const current = getStreakCount(habitId, completions, freezes);
  return { current, target: targetValue, label: `${current} / ${targetValue} day streak`, reached: current >= targetValue };
}
