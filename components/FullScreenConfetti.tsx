import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

const COLORS = [
  '#FF740D', '#FFD700', '#FF3B30', '#34C759',
  '#007AFF', '#FF2D55', '#AF52DE', '#00C7BE',
  '#a786ff', '#fd8bbc', '#eca184', '#f8deb1',
];

const GRAVITY = 900;          // px / s²
const NUM = 130;              // particle count
const FLIGHT = 3.2;           // total flight time in seconds (whole animation)

type Particle = {
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  start: number;   // 0..1 fraction of the global clock when this piece launches
  life: number;    // 0..1 fraction of the global clock this piece stays alive
  color: string;
  w: number;
  h: number;
  br: number;
  spin: number;
};

function buildParticles(): Particle[] {
  const list: Particle[] = [];
  for (let i = 0; i < NUM; i++) {
    const group = i % 3; // 0 left cannon, 1 right cannon, 2 center burst
    let x0: number, y0: number, vx: number, vy: number, start: number;

    if (group === 2) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 600 + Math.random() * 700;
      x0 = W / 2;
      y0 = H / 2;
      vx = speed * Math.cos(angle);
      vy = speed * Math.sin(angle) - 300;
      start = 0;
    } else {
      const isLeft = group === 0;
      const baseDeg = isLeft ? 60 : 120;
      const angleDeg = baseDeg + (Math.random() - 0.5) * 50;
      const rad = (angleDeg * Math.PI) / 180;
      const speed = 700 + Math.random() * 700;
      x0 = isLeft ? -10 : W + 10;
      y0 = H * 0.55;
      vx = speed * Math.cos(rad) * (isLeft ? 1 : -1);
      vy = -speed * Math.sin(rad);
      start = (Math.random() * 0.2) / FLIGHT; // tight stagger (~0–200ms)
    }

    const size = 9 + Math.random() * 9;
    const shape = i % 4; // 0 square, 1 circle, 2 tall, 3 wide
    const w = shape === 2 ? size * 0.45 : shape === 3 ? size * 1.6 : size;
    const h = shape === 2 ? size * 1.9 : shape === 3 ? size * 0.55 : size;
    const br = shape === 1 ? size / 2 : 3;

    list.push({
      x0, y0, vx, vy, start,
      life: 0.7 + Math.random() * 0.3, // fraction of the clock this piece lives
      color: COLORS[i % COLORS.length],
      w, h, br,
      spin: (3 + Math.random() * 5) * 360 * (Math.random() < 0.5 ? -1 : 1),
    });
  }
  return list;
}

/**
 * One shared `clock` (0→1) drives EVERY particle. Each piece reads that single
 * shared value inside its worklet and computes its own ballistic position — so
 * there's exactly one timing animation running, not N. This keeps the whole
 * blast at native frame rate without the start-up hitch of N simultaneous
 * animations.
 */
function ConfettiPiece({ p, clock }: { p: Particle; clock: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    'worklet';
    // local progress for this piece, normalised over its own [start, start+life]
    const local = (clock.value - p.start) / p.life;
    if (local <= 0 || local >= 1) {
      return { opacity: 0, transform: [{ translateX: p.x0 }, { translateY: p.y0 }] };
    }
    const time = local * p.life * FLIGHT; // seconds since this piece launched
    const x = p.x0 + p.vx * time;
    const y = p.y0 + p.vy * time + 0.5 * GRAVITY * time * time;
    const opacity =
      local < 0.04 ? local / 0.04 :
      local > 0.82 ? (1 - local) / 0.18 :
      1;
    return {
      opacity,
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${p.spin * local}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: p.w,
          height: p.h,
          borderRadius: p.br,
          backgroundColor: p.color,
        },
        style,
      ]}
    />
  );
}

export function FullScreenConfetti({ active }: { active: boolean }) {
  const clock = useSharedValue(0);
  // Build particles once per mount — stable identity keeps worklets cheap.
  const particles = useMemo(() => buildParticles(), []);

  useEffect(() => {
    if (active) {
      clock.value = 0;
      clock.value = withTiming(1, {
        duration: FLIGHT * 1000,
        easing: Easing.linear,
      });
    } else {
      cancelAnimation(clock);
      clock.value = 0;
    }
    return () => cancelAnimation(clock);
  }, [active]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <ConfettiPiece key={i} p={p} clock={clock} />
      ))}
    </View>
  );
}
