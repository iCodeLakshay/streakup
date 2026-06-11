import { Redirect } from 'expo-router';

// Phantom screen for the center + tab. The tab button never navigates here —
// it opens AddHabitSheet via uiStore instead.
export default function AddTab() {
  return <Redirect href="/(tabs)" />;
}
