import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY           = '@streakup/theme';
const NOTIFS_KEY          = '@streakup/notifications-enabled';
const DNAME_KEY           = '@streakup/display-name';
const LAST_SYNC_KEY       = '@streakup/last-sync-at';
const FREEZE_COUNT_KEY    = '@streakup/freeze-count';
const FREEZE_REPLENISH_KEY = '@streakup/freeze-replenish';
const AVATAR_KEY          = '@streakup/avatar-uri';

const MAX_FREEZES = 3;

export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsStore {
  themeMode: ThemeMode;
  notificationsEnabled: boolean;
  displayName: string;
  avatarUri: string | null;
  lastSyncAt: string | null;
  freezeCount: number;
  lastFreezeReplenish: string | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  setAvatarUri: (uri: string | null) => Promise<void>;
  setLastSyncAt: (ts: string) => void;
  consumeFreeze: () => boolean;
}

function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  themeMode: 'system',
  notificationsEnabled: true,
  displayName: '',
  avatarUri: null,
  lastSyncAt: null,
  freezeCount: MAX_FREEZES,
  lastFreezeReplenish: null,
  isHydrated: false,

  hydrate: async () => {
    try {
      const [theme, notifs, name, avatar, lastSync, freezeRaw, replenishRaw] = await Promise.all([
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(NOTIFS_KEY),
        AsyncStorage.getItem(DNAME_KEY),
        AsyncStorage.getItem(AVATAR_KEY),
        AsyncStorage.getItem(LAST_SYNC_KEY),
        AsyncStorage.getItem(FREEZE_COUNT_KEY),
        AsyncStorage.getItem(FREEZE_REPLENISH_KEY),
      ]);

      const storedCount = freezeRaw !== null ? parseInt(freezeRaw, 10) : MAX_FREEZES;
      const storedReplenish = replenishRaw;
      const thisWeek = getISOWeek(new Date());

      // Replenish 1 freeze per week (max MAX_FREEZES)
      let freezeCount = isNaN(storedCount) ? MAX_FREEZES : storedCount;
      let lastFreezeReplenish = storedReplenish;
      if (storedReplenish !== thisWeek) {
        freezeCount = Math.min(freezeCount + 1, MAX_FREEZES);
        lastFreezeReplenish = thisWeek;
        AsyncStorage.setItem(FREEZE_COUNT_KEY, String(freezeCount)).catch(() => {});
        AsyncStorage.setItem(FREEZE_REPLENISH_KEY, thisWeek).catch(() => {});
      }

      set({
        themeMode: (theme as ThemeMode | null) ?? 'system',
        notificationsEnabled: notifs !== 'false',
        displayName: name ?? '',
        avatarUri: avatar,
        lastSyncAt: lastSync,
        freezeCount,
        lastFreezeReplenish,
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  setThemeMode: async (mode) => {
    set({ themeMode: mode });
    await AsyncStorage.setItem(THEME_KEY, mode);
  },

  setNotificationsEnabled: async (enabled) => {
    set({ notificationsEnabled: enabled });
    await AsyncStorage.setItem(NOTIFS_KEY, String(enabled));
  },

  setDisplayName: async (name) => {
    set({ displayName: name });
    await AsyncStorage.setItem(DNAME_KEY, name);
  },

  setAvatarUri: async (uri) => {
    set({ avatarUri: uri });
    if (uri) {
      await AsyncStorage.setItem(AVATAR_KEY, uri);
    } else {
      await AsyncStorage.removeItem(AVATAR_KEY);
    }
  },

  setLastSyncAt: (ts) => {
    set({ lastSyncAt: ts });
    AsyncStorage.setItem(LAST_SYNC_KEY, ts).catch(() => {});
  },

  consumeFreeze: () => {
    const { freezeCount } = get();
    if (freezeCount <= 0) return false;
    const next = freezeCount - 1;
    set({ freezeCount: next });
    AsyncStorage.setItem(FREEZE_COUNT_KEY, String(next)).catch(() => {});
    return true;
  },
}));
