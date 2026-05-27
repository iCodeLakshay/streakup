/**
 * Widget data bridge.
 *
 * Serialises the minimal habit state needed by home-screen widgets into
 * SharedPreferences (Android) / App Groups UserDefaults (iOS) via
 * expo-shared-preferences / @react-native-async-storage/async-storage.
 *
 * The native widget reads this key and renders without any JS runtime.
 * Call `syncWidgetData()` after every toggleCompletion or hydrate.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHabitStore, getStreakCount, getTodayDateString } from '@/stores/habitStore';

const WIDGET_KEY = '@streakup/widget-data';

export interface WidgetHabit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  streak: number;
  completedToday: boolean;
}

export interface WidgetPayload {
  habits: WidgetHabit[];
  doneCount: number;
  totalCount: number;
  updatedAt: string;
}

export async function syncWidgetData(): Promise<void> {
  try {
    const { habits, completions, freezes } = useHabitStore.getState();
    const today = getTodayDateString();

    const widgetHabits: WidgetHabit[] = habits.map((h) => ({
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      streak: getStreakCount(h.id, completions, freezes),
      completedToday: completions.some((c) => c.habitId === h.id && c.date === today),
    }));

    const payload: WidgetPayload = {
      habits: widgetHabits,
      doneCount: widgetHabits.filter((h) => h.completedToday).length,
      totalCount: widgetHabits.length,
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(WIDGET_KEY, JSON.stringify(payload));
  } catch {
    // Widget data is best-effort — never block the main flow
  }
}

export async function readWidgetData(): Promise<WidgetPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_KEY);
    return raw ? (JSON.parse(raw) as WidgetPayload) : null;
  } catch {
    return null;
  }
}
