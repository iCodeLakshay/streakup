import { StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TargetProgressBarProps {
  current: number;
  target: number;
  label: string;
  reached: boolean;
}

export function TargetProgressBar({ current, target, label, reached }: TargetProgressBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const ratio = target > 0 ? Math.min(current / target, 1) : 0;
  const fillColor = reached ? '#4CAF50' : '#FF8C00';
  const trackColor = isDark ? '#3A3835' : '#E8E5E0';
  const labelColor = isDark ? '#8A8780' : '#9E9E9E';

  return (
    <View style={styles.root}>
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: fillColor }]} />
      </View>
      <Text style={[styles.label, { color: reached ? '#4CAF50' : labelColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 3 },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    lineHeight: 14,
  },
});
