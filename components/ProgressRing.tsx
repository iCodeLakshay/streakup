import { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedProps, withSpring } from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  progress: number;    // 0-1
  size?: number;       // default 60
  color?: string;      // default '#FF8C00'
  strokeWidth?: number; // default 5
}

export function ProgressRing({
  progress,
  size = 60,
  color = '#FF8C00',
  strokeWidth = 5,
}: ProgressRingProps) {
  const isDark = useColorScheme() === 'dark';
  const trackColor = isDark ? '#3A3835' : '#E8E5E0';

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const animatedProgress = useSharedValue(progress);

  useEffect(() => {
    animatedProgress.value = withSpring(progress, { duration: 300, dampingRatio: 1.0 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <Svg width={size} height={size}>
      {/* Track circle */}
      <Circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {/* Animated arc — rotated so the arc starts at the top */}
      <G rotation={-90} origin={`${center}, ${center}`}>
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}
