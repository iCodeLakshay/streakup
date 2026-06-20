import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('streakup.db');
  return _db;
}

const CURRENT_SCHEMA_VERSION = 4;

export async function initDb(): Promise<void> {
  const db = await getDb();
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // Create tables (v1)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      color TEXT NOT NULL,
      note TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS completions (
      id TEXT PRIMARY KEY NOT NULL,
      habitId TEXT NOT NULL,
      date TEXT NOT NULL,
      UNIQUE(habitId, date)
    );

    CREATE TABLE IF NOT EXISTS freezes (
      id TEXT PRIMARY KEY NOT NULL,
      habitId TEXT NOT NULL,
      date TEXT NOT NULL,
      UNIQUE(habitId, date)
    );
  `);

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = versionRow?.user_version ?? 0;

  if (version < 2) {
    await db.execAsync(`ALTER TABLE habits ADD COLUMN serverId TEXT;`);
  }
  // v3: freezes table already created above via IF NOT EXISTS
  if (version < 4) {
    await db.execAsync(`
      ALTER TABLE habits ADD COLUMN targetType TEXT NOT NULL DEFAULT 'streak';
      ALTER TABLE habits ADD COLUMN targetValue INTEGER NOT NULL DEFAULT 30;
      ALTER TABLE habits ADD COLUMN targetCompletedAt TEXT;
    `);
    await db.execAsync('PRAGMA user_version = 4');
  }
  if (version < CURRENT_SCHEMA_VERSION) {
    await db.execAsync(`PRAGMA user_version = ${CURRENT_SCHEMA_VERSION};`);
  }
}

// ── Maintenance ─────────────────────────────────────────────────────────────

/** Wipe all user data from local SQLite (used on logout / account switch). */
export async function dbClearAll(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM habits;
    DELETE FROM completions;
    DELETE FROM freezes;
  `);
}

// ── Habits ────────────────────────────────────────────────────────────────────

export async function dbGetAllHabits(): Promise<DbHabit[]> {
  const db = await getDb();
  return db.getAllAsync<DbHabit>('SELECT * FROM habits ORDER BY createdAt ASC');
}

export async function dbInsertHabit(habit: DbHabit): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO habits (id, name, emoji, color, note, createdAt, updatedAt, serverId, targetType, targetValue, targetCompletedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [habit.id, habit.name, habit.emoji, habit.color, habit.note ?? null,
     habit.createdAt, habit.updatedAt, habit.serverId ?? null,
     habit.targetType, habit.targetValue, habit.targetCompletedAt ?? null]
  );
}

export async function dbUpdateHabit(habit: DbHabit): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE habits SET name=?, emoji=?, color=?, note=?, updatedAt=?, serverId=?, targetType=?, targetValue=?, targetCompletedAt=? WHERE id=?`,
    [habit.name, habit.emoji, habit.color, habit.note ?? null, habit.updatedAt, habit.serverId ?? null,
     habit.targetType, habit.targetValue, habit.targetCompletedAt ?? null, habit.id]
  );
}

export async function dbUpdateHabitServerId(localId: string, serverId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE habits SET serverId=? WHERE id=?', [serverId, localId]);
}

export async function dbDeleteHabit(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM habits WHERE id=?', [id]);
  await db.runAsync('DELETE FROM completions WHERE habitId=?', [id]);
  await db.runAsync('DELETE FROM freezes WHERE habitId=?', [id]);
}

// ── Completions ───────────────────────────────────────────────────────────────

export async function dbGetAllCompletions(): Promise<DbCompletion[]> {
  const db = await getDb();
  return db.getAllAsync<DbCompletion>('SELECT * FROM completions ORDER BY date ASC');
}

export async function dbInsertCompletion(completion: DbCompletion): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO completions (id, habitId, date) VALUES (?, ?, ?)`,
    [completion.id, completion.habitId, completion.date]
  );
}

export async function dbDeleteCompletion(habitId: string, date: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM completions WHERE habitId=? AND date=?', [habitId, date]);
}

// ── Freezes ───────────────────────────────────────────────────────────────────

export async function dbGetAllFreezes(): Promise<DbFreeze[]> {
  const db = await getDb();
  return db.getAllAsync<DbFreeze>('SELECT * FROM freezes ORDER BY date ASC');
}

export async function dbInsertFreeze(freeze: DbFreeze): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO freezes (id, habitId, date) VALUES (?, ?, ?)`,
    [freeze.id, freeze.habitId, freeze.date]
  );
}

export async function dbDeleteFreezesForHabit(habitId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM freezes WHERE habitId=?', [habitId]);
}

// ── Row types ─────────────────────────────────────────────────────────────────

export interface DbHabit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  serverId?: string | null;
  targetType: string;
  targetValue: number;
  targetCompletedAt: string | null;
}

export interface DbCompletion {
  id: string;
  habitId: string;
  date: string;
}

export interface DbFreeze {
  id: string;
  habitId: string;
  date: string;
}
