import Constants from 'expo-constants';

export const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

// expo-task-manager requires a dev/production build — not available in Expo Go.
// Guard every native call so the module is safe to import in any environment.
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  // Dynamic require keeps the native module from loading at all in Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const TaskManager = require('expo-task-manager') as typeof import('expo-task-manager');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const BackgroundFetch = require('expo-background-fetch') as typeof import('expo-background-fetch');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { rescheduleNotifications } = require('@/utils/notifications') as typeof import('@/utils/notifications');

  // defineTask must be called at module scope (synchronously on first load).
  TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
    try {
      await rescheduleNotifications();
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

export async function registerBackgroundSync(): Promise<void> {
  if (isExpoGo) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const BackgroundFetch = require('expo-background-fetch') as typeof import('expo-background-fetch');
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {
    // Best-effort — never throw
  }
}

export async function unregisterBackgroundSync(): Promise<void> {
  if (isExpoGo) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const BackgroundFetch = require('expo-background-fetch') as typeof import('expo-background-fetch');
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  } catch {}
}
