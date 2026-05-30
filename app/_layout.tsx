import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  useFonts as useDMSans,
} from '@expo-google-fonts/dm-sans';
import {
  DMSerifDisplay_400Regular,
  useFonts as useDMSerif,
} from '@expo-google-fonts/dm-serif-display';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';
import { useHabitStore } from '@/stores/habitStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { initDb } from '@/services/db';
import { pull } from '@/services/syncService';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { hydrate, isHydrated, user, onboardingComplete } = useAuthStore();
  const hydrateHabits   = useHabitStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const lastSyncAt      = useSettingsStore((s) => s.lastSyncAt);

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const prevUser = useRef(user);

  const [sansLoaded] = useDMSans({ DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });
  const [serifLoaded] = useDMSerif({ DMSerifDisplay_400Regular });

  const fontsLoaded = sansLoaded && serifLoaded;

  // Init SQLite + hydrate on launch
  useEffect(() => {
    hydrateSettings();
    initDb().then(hydrate);
  }, []);

  // First sign-in this session: load local habits then pull from server
  useEffect(() => {
    if (user && !prevUser.current) {
      hydrateHabits().then(() => pull(null));
    }
    prevUser.current = user;
  }, [user]);

  // Pull when app comes back to foreground
  useEffect(() => {
    if (!user) return;
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        pull(lastSyncAt);
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [user, lastSyncAt]);

  // Single routing authority — runs whenever auth state settles or changes.
  // Hides the splash screen right after deciding where to go, so the splash
  // always covers any transient unmatched-route frame.
  useEffect(() => {
    if (!fontsLoaded || !isHydrated) return;

    if (!user) {
      router.replace('/onboarding' as any);
    } else if (!onboardingComplete) {
      router.replace('/onboarding/habit-picker' as any);
    }
    // Authenticated + onboarded: already at '/' = (tabs)/index, no navigation needed.

    SplashScreen.hideAsync();
  }, [fontsLoaded, isHydrated, user, onboardingComplete]);

  // Always render the Stack so expo-router always has screens registered.
  // The splash screen covers the initial frame; routing effect navigates away
  // from the root before the splash hides.
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Auth screens */}
        <Stack.Screen name="login"            options={{ headerShown: false }} />
        <Stack.Screen name="signup"           options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password"  options={{ headerShown: false }} />

        {/* Onboarding */}
        <Stack.Screen name="onboarding/index"        options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/habit-picker" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/permissions"  options={{ headerShown: false }} />

        {/* Main app */}
        <Stack.Screen name="(tabs)"        options={{ headerShown: false }} />
        <Stack.Screen name="habit/[id]"    options={{ headerShown: false }} />
        <Stack.Screen name="profile"       options={{ headerShown: false }} />
        <Stack.Screen name="profile/edit"  options={{ headerShown: false }} />
        <Stack.Screen name="modal"         options={{ presentation: 'modal', title: 'Modal' }} />

      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
