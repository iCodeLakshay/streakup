import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, TOKEN_KEY, ONBOARDING_KEY } from '@/services/api';

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
        AsyncStorage.getItem(TOKEN_KEY),
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
      await AsyncStorage.removeItem(TOKEN_KEY);
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
      await AsyncStorage.setItem(TOKEN_KEY, token);
      const onboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
      set({ user, onboardingComplete: onboarding === 'true', isLoading: false });
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
      await AsyncStorage.setItem(TOKEN_KEY, token);
      set({ user, onboardingComplete: false, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY]);
    set({ user: null, onboardingComplete: false, error: null });
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({ onboardingComplete: true });
  },
}));
