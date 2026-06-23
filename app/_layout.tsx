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
import { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, StyleSheet, type AppStateStatus } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';
import { useHabitStore } from '@/stores/habitStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { initDb } from '@/services/db';
import { pull } from '@/services/syncService';
import { configureNotificationHandler, rescheduleNotifications } from '@/utils/notifications';
import '@/utils/backgroundTask';
import { registerBackgroundSync } from '@/utils/backgroundTask';
import { setOnUnauthorized } from '@/services/api';
import { useDayChange } from '@/hooks/use-day-change';

SplashScreen.preventAutoHideAsync();
configureNotificationHandler();

function LoadingFlame({ opacity, isDark }: { opacity: Animated.Value; isDark: boolean }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.9, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, loadingStyles.container, { opacity, backgroundColor: isDark ? '#1F1D1B' : '#FAFAF8' }]}>
      <Animated.View style={{ opacity: pulse }}>
        <Svg width={72} height={72} viewBox="0 0 24 24" fill="none">
          <Defs>
            <LinearGradient id="lf" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="#FFD966" />
              <Stop offset="100%" stopColor="#FF6500" />
            </LinearGradient>
          </Defs>
          <Path d="M12 2c0 6-6 8-6 14a6 6 0 0 0 12 0c0-6-6-8-6-14z" fill="url(#lf)" />
          <Path d="M12 11c0 3-2 4-2 6a2 2 0 0 0 4 0c0-2-2-3-2-6z" fill="white" fillOpacity={0.35} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { hydrate, isHydrated, user, onboardingComplete } = useAuthStore();
  const hydrateHabits   = useHabitStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const lastSyncAt      = useSettingsStore((s) => s.lastSyncAt);

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const prevUser = useRef(user);
  const lastSyncAtRef = useRef(lastSyncAt);
  lastSyncAtRef.current = lastSyncAt;

  const [overlayVisible, setOverlayVisible] = useState(true);
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const hasInitialized = useRef(false);

  const [sansLoaded] = useDMSans({ DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });
  const [serifLoaded] = useDMSerif({ DMSerifDisplay_400Regular });

  const fontsLoaded = sansLoaded && serifLoaded;

  // Init SQLite + hydrate on launch, then schedule reminders (best-effort)
  useEffect(() => {
    hydrateSettings();
    initDb().then(hydrate).then(() => rescheduleNotifications()).then(() => registerBackgroundSync());
  }, []);

  // Register a global 401 handler: clear session and send to login.
  useEffect(() => {
    setOnUnauthorized(() => {
      useAuthStore.getState().logout();
      router.replace('/login' as any);
    });
    return () => setOnUnauthorized(null);
  }, []);

  // Re-derive reminders on a day rollover (streaks recompute on next render).
  useDayChange(() => {
    rescheduleNotifications();
  });

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
        pull(lastSyncAtRef.current);
        rescheduleNotifications();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [user]);

  // Hide the native splash as soon as fonts are loaded so our overlay takes over.
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Once auth is hydrated, fade out the loading overlay then navigate.
  useEffect(() => {
    if (!fontsLoaded || !isHydrated || hasInitialized.current) return;
    hasInitialized.current = true;

    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setOverlayVisible(false);
    });
  }, [fontsLoaded, isHydrated]);

  // Routing authority — runs whenever auth state settles or changes.
  useEffect(() => {
    if (!fontsLoaded || !isHydrated) return;

    if (!user) {
      router.replace('/onboarding' as any);
    } else if (!onboardingComplete) {
      router.replace('/onboarding/habit-picker' as any);
    }
    // Authenticated + onboarded: already at '/' = (tabs)/index, no navigation needed.
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
      {overlayVisible && <LoadingFlame opacity={overlayOpacity} isDark={colorScheme === 'dark'} />}
    </ThemeProvider>
  );
}
