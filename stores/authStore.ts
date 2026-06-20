import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ONBOARDING_KEY, getToken, setToken, clearToken } from '@/services/api';
import { useHabitStore } from '@/stores/habitStore';
import { useSettingsStore } from '@/stores/settingsStore';

// Clear all device-local data belonging to a user. Called before a new account
// is set (login/register) and on logout, so accounts never see each other's data.
async function clearLocalUserData(): Promise<void> {
  await Promise.all([
    useHabitStore.getState().clearLocal(),
    useSettingsStore.getState().resetUserData(),
  ]);
}

export interface AuthUser {
  id: string;
  email: string;
  createdAt?: string;
}

interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  isHydrated: boolean;
  onboardingComplete: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: false,
  isHydrated: false,
  onboardingComplete: false,
  error: null,

  clearError: () => set({ error: null }),

  hydrate: async () => {
    try {
      const [token, onboarding] = await Promise.all([
        getToken(),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);
      if (token) {
        const res = await api.get<{ user: AuthUser }>('/auth/me');
        set({
          user: res.data.user,
          onboardingComplete: onboarding === 'true',
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      // Token invalid or expired — clear it
      await clearToken();
      set({ user: null, isHydrated: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{ token: string; user: AuthUser }>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      const { token, user } = res.data;
      await setToken(token);
      // New account on this device — drop any previous account's local data first.
      await clearLocalUserData();
      // Returning users have already onboarded; go straight to the app.
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      set({ user, onboardingComplete: true, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{ token: string; user: AuthUser }>('/auth/register', {
        email: email.trim().toLowerCase(),
        password,
      });
      const { token, user } = res.data;
      await setToken(token);
      // Brand-new account — ensure a clean local slate, then run onboarding.
      await clearLocalUserData();
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      set({ user, onboardingComplete: false, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await clearToken();
    await clearLocalUserData();
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    set({ user: null, onboardingComplete: false, error: null });
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({ onboardingComplete: true });
  },
}));
