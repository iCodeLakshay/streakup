import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Habit } from '@/stores/habitStore';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  streakCount: number;
  onToggle: () => void;
  onPress?: () => void;
  entranceIndex: number;
  dimmed?: boolean;
}

function FlameIcon({ color, size = 13 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2c0 6-6 8-6 14a6 6 0 0 0 12 0c0-6-6-8-6-14z"
        fill={color}
        stroke="none"
      />
    </Svg>
  );
}

export function HabitCard({
  habit,
  isCompleted,
  streakCount,
  onToggle,
  onPress,
  entranceIndex,
  dimmed = false,
}: HabitCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const entranceOpacity = useRef(new Animated.Value(0)).current;
  const entranceY = useRef(new Animated.Value(12)).current;
  const dimOpacity = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = 180 + entranceIndex * 55;
    Animated.parallel([
      Animated.timing(entranceOpacity, {
        toValue: 1, duration: 380, delay,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(entranceY, {
        toValue: 0, duration: 380, delay,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(dimOpacity, {
      toValue: dimmed ? 0.72 : 1, duration: 220, useNativeDriver: true,
    }).start();
  }, [dimmed]);

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(ringScale, { toValue: 0.82, duration: 80, useNativeDriver: true }),
      Animated.timing(ringScale, { toValue: 1.18, duration: 160, useNativeDriver: true }),
      Animated.timing(ringScale, { toValue: 1.00, duration: 180, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  };

  const isZero = streakCount === 0;

  const cardBg = isCompleted
    ? (isDark ? '#1A3A28' : '#F0FFF4')
    : (isDark ? '#2A2826' : '#F5F3F0');
  const cardBorder = isCompleted
    ? (isDark ? '#2A5A3D' : '#A7F3D0')
    : (isDark ? '#3A3835' : '#E8E5E0');
  const nameColor = isDark ? '#F5F3F0' : '#1F1D1B';
  const streakColor = isDark ? '#8A8780' : '#7A776F';
  const flameColor = isZero ? '#B8B5AE' : '#FF740D';
  const emojiBg = isCompleted
    ? (isDark ? '#0F2820' : '#D1FAE5')
    : (isDark ? '#333130' : '#EEECEA');

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        { opacity: Animated.multiply(entranceOpacity, dimOpacity) },
        { transform: [{ translateY: entranceY }] },
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            opacity: pressed ? 0.88 : isZero ? 0.65 : 1,
          },
        ]}
        onPress={onPress}
        android_ripple={{ color: 'rgba(0,0,0,0.04)', borderless: false }}
      >
        {/* Emoji badge */}
        <View style={[styles.emojiBadge, { backgroundColor: emojiBg }]}>
          <Text style={styles.emojiText}>{habit.emoji}</Text>
        </View>

        {/* Middle: name + streak */}
        <View style={styles.middle}>
          <Text style={[styles.habitName, { color: nameColor }]} numberOfLines={1}>
            {habit.name}
          </Text>
          <View style={styles.streakRow}>
            <FlameIcon color={flameColor} size={13} />
            <Text style={[styles.streakText, { color: streakColor }]}>
              {streakCount > 0 ? `${streakCount} day streak` : 'Start your streak!'}
            </Text>
          </View>
        </View>

        {/* Completion ring */}
        <Pressable style={styles.ringTarget} onPress={handleToggle} hitSlop={4}>
          <Animated.View style={{ transform: [{ scale: ringScale }] }}>
            {isCompleted ? (
              <Svg width={24} height={24} viewBox="0 0 24 24">
                <Circle cx={12} cy={12} r={12} fill="#22C55E" />
                <Polyline
                  points="7 13 10 16 17 9"
                  stroke="white"
                  strokeWidth={2.2}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            ) : (
              <Svg width={24} height={24} viewBox="0 0 24 24">
                <Circle cx={12} cy={12} r={10} fill="none" stroke="#FF740D" strokeWidth={2.5} />
              </Svg>
            )}
          </Animated.View>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginBottom: 10,
    marginHorizontal: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  emojiBadge: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emojiText: {
    fontSize: 22,
  },
  middle: {
    flex: 1,
    gap: 4,
  },
  habitName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15.5,
    lineHeight: 20,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12.5,
  },
  ringTarget: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
