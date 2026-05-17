import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', paddingTop: insets.top }]}>
      <Text style={[styles.title, { color: isDark ? '#F5F5F5' : '#1A1A1A' }]}>Settings</Text>
      <Text style={[styles.sub, { color: isDark ? '#666666' : '#A89F95' }]}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    lineHeight: 34,
  },
  sub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    marginTop: 8,
  },
});
