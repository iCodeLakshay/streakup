import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

export interface ThemeToggleProps {
  value: boolean; // true = light mode (green), false = dark mode (red)
  onValueChange: (v: boolean) => void;
}

export function ThemeToggle({ value, onValueChange }: ThemeToggleProps) {
  const translateX = useRef(new Animated.Value(value ? 1 : 0)).current;
  const bgGlow     = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
    Animated.timing(bgGlow, {
      toValue: value ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [value]);

  // Slider track background: dark left glow (red) ↔ dark right glow (green)
  const trackShadowColor = bgGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(126,4,4,0.56)', 'rgba(1,78,4,0.6)'],
  });

  // Knob translateX: 0px (left) → ~54px (right, ~66% of track width 100px - knob ~40px)
  const knobTranslate = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 36],
  });

  // Light dot color: red → green
  const lightColor = bgGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgb(230,14,14)', 'rgb(35,158,4)'],
  });

  const lightGlow = bgGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(241,28,28,0.8)', 'rgba(57,230,14,0.8)'],
  });

  return (
    <Pressable onPress={() => onValueChange(!value)} style={styles.root}>
      {/* Track */}
      <Animated.View style={[styles.track, { shadowColor: trackShadowColor as unknown as string }]}>
        {/* Knob */}
        <Animated.View style={[styles.knob, { transform: [{ translateX: knobTranslate }] }]}>
          {/* Left light dot */}
          <Animated.View style={[styles.light, { backgroundColor: lightColor as unknown as string, shadowColor: lightGlow as unknown as string }]} />
          {/* Texture lines */}
          <View style={styles.texture} />
          <View style={styles.texture} />
          <View style={styles.texture} />
          {/* Right light dot */}
          <Animated.View style={[styles.light, { backgroundColor: lightColor as unknown as string, shadowColor: lightGlow as unknown as string }]} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 72,
    height: 32,
  },
  track: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgb(8,8,8)',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    // Inset glow simulated via shadowOffset below — RN doesn't do inset shadows,
    // so we use a border + dark bg to approximate the effect.
    shadowOffset: { width: 90, height: 0 },
    shadowOpacity: 0.56,
    shadowRadius: 25,
    elevation: 0,
  },
  knob: {
    position: 'absolute',
    left: 2,
    top: 2,
    bottom: 2,
    width: 28,
    borderRadius: 3,
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#2b2b2b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  light: {
    width: 4,
    height: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#222121',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 0,
  },
  texture: {
    width: 2,
    height: '65%',
    backgroundColor: '#202020',
    borderRadius: 1,
    shadowColor: 'rgba(192,192,192,0.3)',
    shadowOffset: { width: -0.7, height: -1.5 },
    shadowOpacity: 1,
    shadowRadius: 1,
  },
});
