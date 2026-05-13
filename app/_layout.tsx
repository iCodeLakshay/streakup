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
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'onboarding/index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [sansLoaded] = useDMSans({ DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });
  const [serifLoaded] = useDMSerif({ DMSerifDisplay_400Regular });

  const fontsLoaded = sansLoaded && serifLoaded;

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="onboarding/index">
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/step2" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/step3" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
