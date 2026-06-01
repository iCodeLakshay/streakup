/**
 * utils/notifications.ts — Centralized local notification logic for StreakUp.
 *
 * Owns the notification handler config plus scheduling of emotionally-escalating
 * daily reminders for habits that are still incomplete today. All scheduling is
 * local (no server push in MVP). Reminders fire at 4 slots (9am/1pm/6pm/9pm),
 * batch all overdue habit names into one notification per slot, and escalate in
 * tone through the day. Quiet hours (10pm–8am) are enforced. Best-effort: the
 * scheduling routine never throws so notifications can never crash the app.
 */
import * as Notifications from 'expo-notifications';
import { useHabitStore, getTodayDateString, type Habit } from '@/stores/habitStore';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Configures the global notification presentation handler. Called once at module
 * scope from app/_layout.tsx. Matches the existing config in onboarding/permissions.tsx.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Default time slots (24h) for reminders: 9am / 1pm / 6pm / 9pm. */
const DEFAULT_SLOTS = [9, 13, 18, 21];

/** Escalating title phrase per slot index (gentle → urgent).
 *  Index maps to position in DEFAULT_SLOTS so tone escalation is preserved
 *  regardless of which slots the user has selected.
 */
const TONES = [
  '🌱 A gentle nudge',
  "⏳ Don't forget",
  '🔥 Keep your streak alive',
  '🚨 Last chance before midnight!',
];

/**
 * Builds the batched body string from overdue habit names.
 *  - 1 habit  → "Morning Run needs a check-in"
 *  - 2 habits → "Morning Run and Read need a check-in"
 *  - 3+ habits → "Morning Run, Read and N more need a check-in"
 */
function buildBody(names: string[]): string {
  if (names.length === 1) {
    return `${names[0]} needs a check-in`;
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]} need a check-in`;
  }
  const moreCount = names.length - 2;
  return `${names[0]}, ${names[1]} and ${moreCount} more need a check-in`;
}

/**
 * Cancels all pending notifications and reschedules daily reminders for habits
 * not yet completed today. Skips scheduling entirely if notifications are
 * disabled or all habits are complete. Best-effort — never throws.
 */
export async function rescheduleNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!useSettingsStore.getState().notificationsEnabled) return;

  const { habits, completions } = useHabitStore.getState();
  const today = getTodayDateString();
  const completedToday = new Set(
    completions.filter((c) => c.date === today).map((c) => c.habitId)
  );
  const incomplete: Habit[] = habits.filter((h) => !completedToday.has(h.id));

  // Skip if all habits complete (or there are no habits at all).
  if (incomplete.length === 0) return;

  const names = incomplete.map((h) => h.name);

  // Resolve dynamic slots from settings, fallback to defaults
  const configuredSlots: number[] =
    useSettingsStore.getState().notificationSlots ?? DEFAULT_SLOTS;

  // Quiet-hours guard: only schedule within allowed hours (8am–10pm).
  const ALLOWED = configuredSlots.filter((h) => h >= 8 && h < 22);

  try {
    const body = buildBody(names);
    for (let i = 0; i < ALLOWED.length; i++) {
      const hour = ALLOWED[i];
      // Map this hour to its position in DEFAULT_SLOTS to pick the right tone.
      const toneIndex = DEFAULT_SLOTS.indexOf(hour);
      const title = toneIndex >= 0
        ? (TONES[toneIndex] ?? TONES[TONES.length - 1])
        : (TONES[i] ?? TONES[TONES.length - 1]);
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: 0,
        },
      });
    }
  } catch {
    // Swallow — notifications must never crash the app.
  }
}

/**
 * Requests notification permissions and, if granted, schedules reminders.
 * Returns true if permission was granted, false otherwise.
 */
export async function requestAndSchedule(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status === 'granted') {
    await rescheduleNotifications();
    return true;
  }
  return false;
}
