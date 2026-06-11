import { useEffect, useRef, useState } from 'react';
import {
  Animated, Modal, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { TargetType } from '@/stores/habitStore';
import { FullScreenConfetti } from '@/components/FullScreenConfetti';

const PRESETS = [7, 21, 30, 66, 90];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function targetLabel(type: TargetType, value: number): string {
  if (type === 'total') return `${value} completions`;
  if (type === 'weekdays') return 'your weekday target';
  if (type === 'weekly_frequency') return `${value}×/week target`;
  return `${value}-day streak`;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface TargetReachedModalProps {
  visible: boolean;
  habitName: string;
  habitEmoji: string;
  targetType: TargetType;
  targetValue: number;
  onArchive: () => void;
  onSetNewTarget: (newValue: number) => void;
  onDismiss: () => void;
}

export function TargetReachedModal({
  visible,
  habitName,
  habitEmoji,
  targetType,
  targetValue,
  onArchive,
  onSetNewTarget,
  onDismiss,
}: TargetReachedModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [mode, setMode] = useState<'celebrate' | 'new-target'>('celebrate');
  const [addOn, setAddOn] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(30);
  const [confettiActive, setConfettiActive] = useState(false);

  const scaleAnim   = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMode('celebrate');
      setSelectedPreset(30);
      setAddOn(true);
      setConfettiActive(true);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 200 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
      // Let confetti run for 4 s then stop
      const timer = setTimeout(() => setConfettiActive(false), 4000);
      return () => clearTimeout(timer);
    } else {
      setConfettiActive(false);
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleSetNewTarget = () => {
    onSetNewTarget(addOn ? targetValue + selectedPreset : selectedPreset);
  };

  const cardBg        = isDark ? '#2A2826' : '#FFFFFF';
  const textPrimary   = isDark ? '#F5F3F0' : '#1F1D1B';
  const textSecondary = isDark ? '#8A8780' : '#7A776F';
  const surface       = isDark ? '#3A3835' : '#F5F3F0';
  const border        = isDark ? '#4A4745' : '#E8E5E0';
  const primary       = '#FF740D';

  return (
    <>
    {/* Confetti lives in the host screen's view tree (NOT inside <Modal>), so
        react-native-reanimated's UI thread attaches to it correctly on Android.
        zIndex keeps it above the modal's dimmed backdrop. */}
    {visible && (
      <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} pointerEvents="none">
        <FullScreenConfetti active={confettiActive} />
      </View>
    )}

    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onDismiss}>

      {/* ── 1. Dark backdrop + card ── */}
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: cardBg, opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Prevent backdrop dismiss when tapping inside card */}
          <Pressable>
            {mode === 'celebrate' ? (
              <>
                <Text style={styles.trophy}>🏆</Text>
                <Text style={[styles.title, { color: textPrimary }]}>Target Reached!</Text>
                <Text style={[styles.habitLine, { color: textSecondary }]}>
                  {habitEmoji} {habitName}
                </Text>
                <Text style={[styles.body, { color: textSecondary }]}>
                  You hit {targetLabel(targetType, targetValue)}. Amazing work!
                </Text>
                <View style={styles.btnStack}>
                  <Pressable
                    style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]}
                    onPress={() => setMode('new-target')}
                  >
                    <Text style={styles.primaryBtnText}>Set New Target</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      { borderColor: border, backgroundColor: surface },
                      pressed && { opacity: 0.75 },
                    ]}
                    onPress={onArchive}
                  >
                    <Text style={[styles.secondaryBtnText, { color: textPrimary }]}>Archive Habit</Text>
                  </Pressable>
                  <Pressable onPress={onDismiss} hitSlop={8}>
                    <Text style={[styles.skipText, { color: textSecondary }]}>Dismiss</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.title, { color: textPrimary }]}>Set New Target</Text>
                <Text style={[styles.body, { color: textSecondary }]}>
                  Current: {targetLabel(targetType, targetValue)}
                </Text>
                <View style={[styles.toggleRow, { backgroundColor: surface, borderColor: border }]}>
                  <Pressable
                    onPress={() => setAddOn(true)}
                    style={[styles.toggleOption, addOn && { backgroundColor: primary }]}
                  >
                    <Text style={[styles.toggleText, { color: addOn ? '#FFF' : textSecondary }]}>Add on</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setAddOn(false)}
                    style={[styles.toggleOption, !addOn && { backgroundColor: primary }]}
                  >
                    <Text style={[styles.toggleText, { color: !addOn ? '#FFF' : textSecondary }]}>Fresh start</Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetRow}
                >
                  {PRESETS.map(n => {
                    const active = selectedPreset === n;
                    return (
                      <Pressable
                        key={n}
                        onPress={() => setSelectedPreset(n)}
                        style={[
                          styles.presetChip,
                          { backgroundColor: active ? primary : surface, borderColor: active ? primary : border },
                        ]}
                      >
                        <Text style={[styles.presetText, { color: active ? '#FFF' : textPrimary }]}>
                          {addOn ? `+${n}` : `${n}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Text style={[styles.newTargetPreview, { color: textSecondary }]}>
                  New target:{' '}
                  <Text style={{ fontFamily: 'DMSans_700Bold', color: primary }}>
                    {addOn ? targetValue + selectedPreset : selectedPreset}
                  </Text>{' '}
                  {targetType === 'total' ? 'completions' : 'days'}
                </Text>
                <View style={styles.btnStack}>
                  <Pressable
                    style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]}
                    onPress={handleSetNewTarget}
                  >
                    <Text style={styles.primaryBtnText}>Confirm</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      { borderColor: border, backgroundColor: surface },
                      pressed && { opacity: 0.75 },
                    ]}
                    onPress={() => setMode('celebrate')}
                  >
                    <Text style={[styles.secondaryBtnText, { color: textPrimary }]}>Back</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.50)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  trophy: { fontSize: 56, marginBottom: 4 },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 24,
    textAlign: 'center',
  },
  habitLine: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    textAlign: 'center',
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  btnStack: { width: '100%', gap: 10, marginTop: 8 },
  primaryBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FF740D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontFamily: 'DMSans_700Bold', fontSize: 16, color: '#FFF' },
  secondaryBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontFamily: 'DMSans_700Bold', fontSize: 16 },
  skipText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    width: '100%',
    marginTop: 4,
  },
  toggleOption: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: { fontFamily: 'DMSans_700Bold', fontSize: 14 },
  presetRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  presetChip: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: { fontFamily: 'DMSans_700Bold', fontSize: 14 },
  newTargetPreview: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    textAlign: 'center',
  },
});
