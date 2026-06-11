import {
  dbGetAllHabits,
  dbInsertHabit,
  dbUpdateHabit,
  dbDeleteHabit,
  dbGetAllCompletions,
  dbInsertCompletion,
  dbDeleteCompletion,
  dbGetAllFreezes,
  dbInsertFreeze,
  type DbHabit,
  type DbCompletion,
  type DbFreeze,
} from './db';
import type { Habit, Completion, Freeze, TargetType } from '@/stores/habitStore';

// ── Habits ────────────────────────────────────────────────────────────────────

export async function getAllHabits(): Promise<Habit[]> {
  const rows = await dbGetAllHabits();
  return rows.map(rowToHabit);
}

export async function createHabit(habit: Habit): Promise<void> {
  await dbInsertHabit(habitToRow(habit));
}

export async function updateHabit(habit: Habit): Promise<void> {
  await dbUpdateHabit(habitToRow(habit));
}

export async function deleteHabit(id: string): Promise<void> {
  await dbDeleteHabit(id);
}

// ── Completions ───────────────────────────────────────────────────────────────

export async function getAllCompletions(): Promise<Completion[]> {
  const rows = await dbGetAllCompletions();
  return rows.map(rowToCompletion);
}

export async function addCompletion(completion: Completion): Promise<void> {
  await dbInsertCompletion(completionToRow(completion));
}

export async function removeCompletion(habitId: string, date: string): Promise<void> {
  await dbDeleteCompletion(habitId, date);
}

// ── Freezes ───────────────────────────────────────────────────────────────────

export async function getAllFreezes(): Promise<Freeze[]> {
  const rows = await dbGetAllFreezes();
  return rows.map(rowToFreeze);
}

export async function insertFreeze(freeze: Freeze): Promise<void> {
  await dbInsertFreeze(freezeToRow(freeze));
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function rowToHabit(row: DbHabit): Habit {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    serverId: row.serverId ?? undefined,
    targetType: row.targetType as TargetType,
    targetValue: row.targetValue,
    targetCompletedAt: row.targetCompletedAt ?? null,
  };
}

function habitToRow(h: Habit): DbHabit {
  return {
    id: h.id,
    name: h.name,
    emoji: h.emoji,
    color: h.color,
    note: h.note,
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
    serverId: h.serverId ?? null,
    targetType: h.targetType,
    targetValue: h.targetValue,
    targetCompletedAt: h.targetCompletedAt,
  };
}

function rowToCompletion(row: DbCompletion): Completion {
  return { id: row.id, habitId: row.habitId, date: row.date };
}

function completionToRow(c: Completion): DbCompletion {
  return { id: c.id, habitId: c.habitId, date: c.date };
}

function rowToFreeze(row: DbFreeze): Freeze {
  return { id: row.id, habitId: row.habitId, date: row.date };
}

function freezeToRow(f: Freeze): DbFreeze {
  return { id: f.id, habitId: f.habitId, date: f.date };
}
