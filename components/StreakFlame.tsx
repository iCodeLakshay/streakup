import Svg, { Path } from 'react-native-svg';

export interface StreakFlameProps {
  streak: number;
  size?: number; // default 13
}

function getFlameColor(streak: number): string {
  if (streak === 0) return '#CCCCCC';
  if (streak <= 6) return '#FF8C00';
  return '#FF4500';
}

export function StreakFlame({ streak, size = 13 }: StreakFlameProps) {
  const color = getFlameColor(streak);
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
