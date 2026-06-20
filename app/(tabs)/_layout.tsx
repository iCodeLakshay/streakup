import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUIStore } from '@/stores/uiStore';

// ─── Center add button ─────────────────────────────────────────────────────────

function CenterAddButton(_props: BottomTabBarButtonProps) {
  const openAddHabit = useUIStore(s => s.openAddHabit);

  return (
    <View style={centerStyles.wrap}>
      <Pressable
        testID="center-add-btn"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          openAddHabit();
        }}
        style={({ pressed }) => [centerStyles.btn, pressed && { opacity: 0.88, transform: [{ scale: 0.94 }] }]}
        hitSlop={6}
      >
        <Text style={centerStyles.plus}>+</Text>
      </Pressable>
    </View>
  );
}

const centerStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Lift the button above the tab bar
    marginBottom: 45,
  },
  btn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FF740D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF740D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  plus: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
    fontFamily: 'DMSans_400Regular',
    marginTop: -2,
  },
});

// ─── Layout ───────────────────────────────────────────────────────────────────

const tabLabelStyle = {
  fontFamily: 'DMSans_500Medium',
  fontSize: 10,
  marginTop: 1,
  includeFontPadding: false,
} as const;

export default function TabLayout() {
  const isDark = useColorScheme() === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF740D',
        tabBarInactiveTintColor: isDark ? '#666666' : '#C5BFB8',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderTopColor: isDark ? '#2A2A2A' : '#F0F0F0',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: {
          fontFamily: 'DMSans_500Medium',
          fontSize: 10,
          marginTop: 1,
          includeFontPadding: false,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
          minWidth: 48,
          flex: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="flame.fill" color={color} />,
          tabBarLabel: ({ color }) => (
            <Text style={[tabLabelStyle, { color }]} numberOfLines={1} allowFontScaling={false}>
              Home
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="chart.bar.fill" color={color} />,
          tabBarLabel: ({ color }) => (
            <Text style={[tabLabelStyle, { color }]} numberOfLines={1} allowFontScaling={false}>
              Stats
            </Text>
          ),
        }}
      />
      {/* Center add button — no label, custom button component */}
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (props) => <CenterAddButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Badges',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="trophy.fill" color={color} />,
          tabBarLabel: ({ color }) => (
            <Text style={[tabLabelStyle, { color }]} numberOfLines={1} allowFontScaling={false}>
              Badges
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="gearshape.fill" color={color} />,
          tabBarLabel: ({ color }) => (
            <Text style={[tabLabelStyle, { color }]} numberOfLines={1} allowFontScaling={false}>
              Settings
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}
