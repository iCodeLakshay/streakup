import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

export function useColorScheme(): 'light' | 'dark' {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const system    = useSystemColorScheme();

  if (themeMode === 'light') return 'light';
  if (themeMode === 'dark')  return 'dark';
  return system ?? 'light';
}
