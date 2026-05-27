/**
 * Offline-first sync service.
 *
 * Writes always go to SQLite first (optimistic). Network calls are fire-and-forget:
 * UI never waits on them, and failures are swallowed silently — the next sync will
 * reconcile. Pull uses last-write-wins (updatedAt) for conflict resolution.
 */

import { api } from './api';
import { dbUpdateHabitServerId, dbInsertCompletion, dbDeleteCompletion } from './db';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Habit, Completion } from '@/stores/habitStore';

// Lazy accessor breaks the circular dep — evaluated inside function bodies only,
// by which point both modules are fully initialised.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const habitStore = () => (require('@/stores/habitStore') as typeof import('@/stores/habitStore')).useHabitStore;

// ── Server shapes (from API) ──────────────────────────────────────────────────

interface ServerHabit {
  _id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

interface ServerCompletion {
  _id: string;
  habitId: string; // server habit _id
  date: string;
  completedAt: string;
  createdAt: string;
}

interface PullPayload {
  habits: ServerHabit[];
  completions: ServerCompletion[];
  deletions: { id: string; archivedAt: string }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function noop() {}

function fire(fn: () => Promise<void>): void {
  fn().catch(noop);
}

// ── Per-operation sync calls (called from habitStore actions) ─────────────────

export function createHabitOnServer(habit: Habit): void {
  fire(async () => {
    const res = await api.post<{ data: ServerHabit }>('/habits', {
      name: habit.name,
      emoji: habit.emoji,
      color: habit.color,
      note: habit.note,
    });
    const serverId = res.data.data._id;
    await dbUpdateHabitServerId(habit.id, serverId);
    // Patch Zustand state so future sync calls have the serverId
    habitStore().setState((s) => ({
      habits: s.habits.map((h) => h.id === habit.id ? { ...h, serverId } : h),
    }));
  });
}

export function updateHabitOnServer(habit: Habit): void {
  if (!habit.serverId) return;
  fire(async () => {
    await api.patch(`/habits/${habit.serverId}`, {
      name: habit.name,
      emoji: habit.emoji,
      color: habit.color,
      note: habit.note,
    });
  });
}

export function deleteHabitOnServer(serverId: string): void {
  fire(async () => {
    await api.delete(`/habits/${serverId}`);
  });
}

export function syncCompletionAdd(habitServerId: string, date: string): void {
  fire(async () => {
    await api.post(`/habits/${habitServerId}/complete`, { date });
  });
}

export function syncCompletionRemove(habitServerId: string, date: string): void {
  fire(async () => {
    await api.delete(`/habits/${habitServerId}/undo`, { data: { date } });
  });
}

// ── Pull: merge server changes into local store ───────────────────────────────

export async function pull(since: string | null): Promise<void> {
  try {
    const url = since
      ? `/sync/pull?since=${encodeURIComponent(since)}`
      : '/sync/pull';
    const res = await api.get<{ data: PullPayload }>(url);
    const { habits: serverHabits, completions: serverCompletions, deletions } = res.data.data;

    const { habits: localHabits, completions: localCompletions } = habitStore().getState();

    // ── Merge habits (last-write-wins) ──────────────────────────────────────
    const updatedHabits = [...localHabits];
    for (const sh of serverHabits) {
      const idx = updatedHabits.findIndex((h) => h.serverId === sh._id);
      if (idx !== -1) {
        // Exists locally — update if server is newer
        if (sh.updatedAt > updatedHabits[idx].updatedAt) {
          updatedHabits[idx] = {
            ...updatedHabits[idx],
            name: sh.name,
            emoji: sh.emoji ?? updatedHabits[idx].emoji,
            color: sh.color ?? updatedHabits[idx].color,
            note: sh.note,
            updatedAt: sh.updatedAt,
          };
        }
      }
      // Habits created on another device (no local match) — skip for MVP;
      // full device migration is handled by push on first login.
    }

    // ── Remove deleted habits ───────────────────────────────────────────────
    const deletedServerIds = new Set(deletions.map((d) => d.id));
    const habitsAfterDeletion = updatedHabits.filter((h) => !h.serverId || !deletedServerIds.has(h.serverId));

    // ── Merge completions (additive — server completions union with local) ──
    const updatedCompletions = [...localCompletions];
    for (const sc of serverCompletions) {
      const localHabit = habitsAfterDeletion.find((h) => h.serverId === sc.habitId);
      if (!localHabit) continue;
      const alreadyExists = updatedCompletions.some(
        (c) => c.habitId === localHabit.id && c.date === sc.date
      );
      if (!alreadyExists) {
        const completion: Completion = {
          id: `${localHabit.id}-${sc.date}`,
          habitId: localHabit.id,
          date: sc.date,
        };
        updatedCompletions.push(completion);
        // Persist to SQLite directly — do NOT call toggleCompletion (would re-sync)
        await dbInsertCompletion({ id: completion.id, habitId: completion.habitId, date: completion.date });
      }
    }

    // Remove completions for deleted habits
    const filteredCompletions = updatedCompletions.filter(
      (c) => !deletedServerIds.has(
        habitsAfterDeletion.find((h) => h.id === c.habitId)?.serverId ?? ''
      )
    );

    // Apply merged state in one shot
    habitStore().setState({
      habits: habitsAfterDeletion,
      completions: filteredCompletions,
    });

    useSettingsStore.getState().setLastSyncAt(new Date().toISOString());
  } catch {
    // Silent — sync is always background
  }
}

// ── Push: send full local state to server ─────────────────────────────────────

export async function push(): Promise<void> {
  try {
    const { habits, completions } = habitStore().getState();

    const serverHabits = habits.map((h) => ({
      localId: h.id,
      serverId: h.serverId,
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      note: h.note,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
    }));

    const serverCompletions = completions
      .map((c) => {
        const habit = habits.find((h) => h.id === c.habitId);
        return habit?.serverId ? { habitId: habit.serverId, date: c.date } : null;
      })
      .filter((c): c is { habitId: string; date: string } => c !== null);

    await api.post('/sync/push', { habits: serverHabits, completions: serverCompletions });
    useSettingsStore.getState().setLastSyncAt(new Date().toISOString());
  } catch {
    // Silent
  }
}
