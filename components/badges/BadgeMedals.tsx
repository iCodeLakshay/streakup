/**
 * BadgeMedals.tsx — inline react-native-svg medals for the Achievements screen.
 *
 * All 7 badges share ONE medal silhouette (ribbon + triple-circle medal +
 * highlight). Only the color palette and the center content (star vs number)
 * change per badge — exactly how the source files in assets/svg were authored.
 *
 * Gradient <Defs> ids are suffixed with a per-instance `uid` so multiple medals
 * can render on the same screen without id collisions.
 */
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

export type BadgeId =
  | 'perfect-day'
  | 'streak-7'
  | 'streak-15'
  | 'streak-30'
  | 'streak-50'
  | 'streak-100'
  | 'streak-365';

type Center =
  | { kind: 'star' }
  | { kind: 'text'; value: string; fontSize: number; y: number; fill: string };

interface MedalPalette {
  ribbonL: [string, string];        // linear gradient stops
  ribbonR: [string, string];        // linear gradient stops
  medal: [string, string, string];  // radial: light → mid → dark
  ringLight: string;                 // inner stroke + ring light stop
  ringDark: string;                  // ring dark stop
  center: Center;
  shine?: { cx: number; cy: number; r: number }[]; // diamond sparkle dots
}

export const BADGE_PALETTES: Record<BadgeId, MedalPalette> = {
  'perfect-day': {
    ribbonL: ['#4F46E5', '#7C3AED'],
    ribbonR: ['#7C3AED', '#EC4899'],
    medal: ['#FDE68A', '#FBBF24', '#D97706'],
    ringLight: '#FFF7D6',
    ringDark: '#B45309',
    center: { kind: 'star' },
  },
  'streak-7': {
    ribbonL: ['#B45309', '#D97706'],
    ribbonR: ['#D97706', '#F59E0B'],
    medal: ['#FDE68A', '#CD7F32', '#8B4513'],
    ringLight: '#FDE68A',
    ringDark: '#8B4513',
    center: { kind: 'text', value: '7', fontSize: 96, y: 340, fill: '#FFF8E7' },
  },
  'streak-15': {
    ribbonL: ['#64748B', '#94A3B8'],
    ribbonR: ['#94A3B8', '#CBD5E1'],
    medal: ['#F8FAFC', '#CBD5E1', '#64748B'],
    ringLight: '#F8FAFC',
    ringDark: '#64748B',
    center: { kind: 'text', value: '15', fontSize: 82, y: 340, fill: '#FFFFFF' },
  },
  'streak-30': {
    ribbonL: ['#D97706', '#F59E0B'],
    ribbonR: ['#F59E0B', '#FBBF24'],
    medal: ['#FFF7D6', '#FBBF24', '#B45309'],
    ringLight: '#FFF7D6',
    ringDark: '#B45309',
    center: { kind: 'text', value: '30', fontSize: 82, y: 340, fill: '#FFFDF5' },
  },
  'streak-50': {
    ribbonL: ['#065F46', '#10B981'],
    ribbonR: ['#10B981', '#34D399'],
    medal: ['#D1FAE5', '#34D399', '#047857'],
    ringLight: '#D1FAE5',
    ringDark: '#047857',
    center: { kind: 'text', value: '50', fontSize: 82, y: 340, fill: '#FFFFFF' },
  },
  'streak-100': {
    ribbonL: ['#991B1B', '#DC2626'],
    ribbonR: ['#DC2626', '#EF4444'],
    medal: ['#FECACA', '#EF4444', '#991B1B'],
    ringLight: '#FECACA',
    ringDark: '#991B1B',
    center: { kind: 'text', value: '100', fontSize: 70, y: 332, fill: '#FFFFFF' },
  },
  'streak-365': {
    ribbonL: ['#2563EB', '#7C3AED'],
    ribbonR: ['#7C3AED', '#A855F7'],
    medal: ['#FFFFFF', '#93C5FD', '#60A5FA'],
    ringLight: '#FFFFFF',
    ringDark: '#60A5FA',
    center: { kind: 'text', value: '365', fontSize: 62, y: 325, fill: '#FFFFFF' },
    shine: [
      { cx: 215, cy: 270, r: 8 },
      { cx: 315, cy: 250, r: 6 },
      { cx: 330, cy: 320, r: 5 },
    ],
  },
};

// Greyscale palette used when a badge is locked.
const LOCKED: MedalPalette = {
  ribbonL: ['#9CA3AF', '#B6BCC4'],
  ribbonR: ['#B6BCC4', '#CBD0D6'],
  medal: ['#E5E7EB', '#B6BCC4', '#7E848C'],
  ringLight: '#E5E7EB',
  ringDark: '#7E848C',
  center: { kind: 'text', value: '', fontSize: 1, y: 340, fill: '#9CA3AF' },
};

const STAR_PATH =
  'M256 238 L275 278 L319 284 L287 315 L295 360 L256 339 L217 360 L225 315 L193 284 L237 278 Z';

interface BadgeMedalProps {
  id: BadgeId;
  size: number;
  locked?: boolean;
  isNew?: boolean;
}

export function BadgeMedal({ id, size, locked = false, isNew = false }: BadgeMedalProps) {
  const scale = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  useEffect(() => {
    if (!isNew) return;
    Animated.spring(scale, {
      toValue: 1,
      tension: 200,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);
  const base = BADGE_PALETTES[id];
  const p = locked ? { ...LOCKED, center: base.center } : base;

  // Unique gradient ids per instance to avoid <Defs> collisions on screen.
  const uid = `${id}${locked ? '-lk' : ''}`;
  const ribbonLId = `rL-${uid}`;
  const ribbonRId = `rR-${uid}`;
  const medalId = `md-${uid}`;
  const ringId = `rg-${uid}`;

  const center = p.center;
  // Lock hides the center content (a padlock-style look is conveyed by greyscale).
  const showCenter = !locked;

  return (
    <Animated.View style={isNew ? { transform: [{ scale }] } : undefined}>
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id={ribbonLId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={p.ribbonL[0]} />
          <Stop offset="100%" stopColor={p.ribbonL[1]} />
        </LinearGradient>
        <LinearGradient id={ribbonRId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={p.ribbonR[0]} />
          <Stop offset="100%" stopColor={p.ribbonR[1]} />
        </LinearGradient>
        <RadialGradient id={medalId} cx="35%" cy="30%">
          <Stop offset="0%" stopColor={p.medal[0]} />
          <Stop offset="55%" stopColor={p.medal[1]} />
          <Stop offset="100%" stopColor={p.medal[2]} />
        </RadialGradient>
        <LinearGradient id={ringId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={p.ringLight} />
          <Stop offset="100%" stopColor={p.ringDark} />
        </LinearGradient>
      </Defs>

      {/* Ribbon */}
      <Polygon points="130,40 220,40 280,170 200,170" fill={`url(#${ribbonLId})`} />
      <Polygon points="292,40 382,40 312,170 232,170" fill={`url(#${ribbonRId})`} />
      <Rect
        x={205}
        y={155}
        width={102}
        height={40}
        rx={8}
        fill="#F8FAFC"
        stroke="#CBD5E1"
        strokeWidth={6}
      />

      {/* Medal */}
      <Circle cx={256} cy={315} r={130} fill={`url(#${ringId})`} />
      <Circle
        cx={256}
        cy={315}
        r={108}
        fill={`url(#${medalId})`}
        stroke={p.ringLight}
        strokeWidth={8}
      />
      <Circle
        cx={256}
        cy={315}
        r={92}
        fill="none"
        stroke={p.ringLight}
        strokeWidth={5}
        opacity={0.6}
      />

      {/* Center content */}
      {showCenter && center.kind === 'star' && (
        <Path
          d={STAR_PATH}
          fill="#FFFDF5"
          stroke="#F59E0B"
          strokeWidth={6}
          strokeLinejoin="round"
        />
      )}
      {showCenter && center.kind === 'text' && (
        <SvgText
          x={256}
          y={center.y}
          textAnchor="middle"
          fontSize={center.fontSize}
          fontWeight="900"
          fontFamily="DMSans_700Bold"
          fill={center.fill}
        >
          {center.value}
        </SvgText>
      )}

      {/* Locked padlock glyph */}
      {locked && (
        <Path
          d="M236 300 v-14 a20 20 0 0 1 40 0 v14 M224 300 h64 a8 8 0 0 1 8 8 v36 a8 8 0 0 1 -8 8 h-64 a8 8 0 0 1 -8 -8 v-36 a8 8 0 0 1 8 -8 Z"
          fill="#F3F4F6"
          stroke="#6B7280"
          strokeWidth={6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Diamond sparkle */}
      {showCenter &&
        p.shine?.map((s, i) => (
          <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="white" />
        ))}

      {/* Highlight */}
      <Ellipse cx={225} cy={265} rx={45} ry={22} fill="white" opacity={locked ? 0.12 : 0.18} />
    </Svg>
    </Animated.View>
  );
}
