import { useState, type ComponentProps } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { TargetType } from '@/stores/habitStore';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export interface TargetPickerValue {
  type: TargetType;
  value: number;
}

interface TargetPickerProps {
  value: TargetPickerValue;
  onChange: (v: TargetPickerValue) => void;
  onCustomInputFocus?: () => void;
}

const TYPE_OPTIONS: { type: TargetType; icon: MaterialIconName; label: string; desc: string }[] = [
  { type: 'streak',           icon: 'local-fire-department', label: 'Streak',    desc: 'Hit a N-day streak' },
  { type: 'total',            icon: 'check-circle',          label: 'Total',     desc: 'Complete N times' },
  { type: 'weekdays',         icon: 'calendar-today',        label: 'Weekdays',  desc: 'Only on selected days' },
  { type: 'weekly_frequency', icon: 'bar-chart',             label: 'Weekly',    desc: 'X days per week' },
];

const STREAK_PRESETS = [7, 21, 30, 66, 90];
const WEEKLY_MAX = 6; // can't pick 7 (that's every day — use streak instead)

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Bitmask helpers: day index 0=Sun … 6=Sat, bit = 1 << index
function encodeDays(days: number[]): number {
  return days.reduce((acc, d) => acc | (1 << d), 0);
}
function decodeDays(mask: number): number[] {
  return [0, 1, 2, 3, 4, 5, 6].filter(i => mask & (1 << i));
}

export function TargetPicker({ value, onChange, onCustomInputFocus }: TargetPickerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  // For weekdays: decode current bitmask
  const selectedDays = value.type === 'weekdays' ? decodeDays(value.value) : [];

  const surface   = isDark ? '#2C2C2E' : '#F5F3F0';
  const surface2  = isDark ? '#3A3835' : '#E8E5E0';
  const text      = isDark ? '#F5F3F0' : '#1F1D1B';
  const subText   = isDark ? '#8A8780' : '#7A776F';
  const border    = isDark ? '#3A3835' : '#E8E5E0';
  const primary   = '#FF740D';
  const inputText = isDark ? '#F5F5F5' : '#1F1D1B';

  const handleTypeSelect = (type: TargetType) => {
    setShowCustom(false);
    setCustomInput('');
    if (type === 'weekdays') {
      // Default: Mon–Fri selected
      onChange({ type, value: encodeDays([1, 2, 3, 4, 5]) });
    } else if (type === 'weekly_frequency') {
      onChange({ type, value: 3 });
    } else {
      onChange({ type, value: 30 });
    }
  };

  const handlePreset = (preset: number) => {
    setShowCustom(false);
    setCustomInput('');
    onChange({ ...value, value: preset });
  };

  const handleCustomSubmit = () => {
    const n = parseInt(customInput, 10);
    if (!isNaN(n) && n >= 1 && n <= 365) {
      onChange({ ...value, value: n });
    }
  };

  const toggleDay = (dayIndex: number) => {
    const current = decodeDays(value.value);
    const next = current.includes(dayIndex)
      ? current.filter(d => d !== dayIndex)
      : [...current, dayIndex];
    if (next.length === 0) return; // must keep at least 1
    onChange({ ...value, value: encodeDays(next) });
  };

  return (
    <View style={styles.root}>
      {/* Step 1 — Type grid */}
      <View style={styles.typeGrid}>
        {TYPE_OPTIONS.map(opt => {
          const active = value.type === opt.type;
          return (
            <Pressable
              key={opt.type}
              onPress={() => handleTypeSelect(opt.type)}
              style={[
                styles.typeCard,
                {
                  backgroundColor: active ? (isDark ? 'rgba(255,116,13,0.18)' : '#FFF3E0') : surface,
                  borderColor: active ? primary : border,
                },
              ]}
            >
              <MaterialIcons
                name={opt.icon}
                size={24}
                color={active ? primary : (isDark ? '#A8A6A0' : '#6A6762')}
              />
              <View style={styles.typeTextCol}>
                <Text style={[styles.typeLabel, { color: active ? primary : text }]}>{opt.label}</Text>
                <Text style={[styles.typeDesc, { color: subText }]} numberOfLines={2}>{opt.desc}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Step 2 — Value selector */}
      {value.type === 'weekdays' ? (
        // Day-of-week pill toggles
        <View style={styles.dayRow}>
          {DAY_LABELS.map((label, i) => {
            const active = selectedDays.includes(i);
            return (
              <Pressable
                key={i}
                onPress={() => toggleDay(i)}
                style={[
                  styles.dayPill,
                  {
                    backgroundColor: active ? primary : surface,
                    borderColor: active ? primary : border,
                  },
                ]}
              >
                <Text style={[styles.dayPillText, { color: active ? '#FFF' : subText }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : value.type === 'weekly_frequency' ? (
        // 1–6 chips
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {Array.from({ length: WEEKLY_MAX }, (_, i) => i + 1).map(n => {
            const active = value.value === n;
            return (
              <Pressable
                key={n}
                onPress={() => handlePreset(n)}
                style={[styles.chip, { backgroundColor: active ? primary : surface, borderColor: active ? primary : border }]}
              >
                <Text style={[styles.chipText, { color: active ? '#FFF' : text }]}>{n}×</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        // streak / total: preset chips + custom
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {STREAK_PRESETS.map(n => {
              const active = value.value === n && !showCustom;
              return (
                <Pressable
                  key={n}
                  onPress={() => handlePreset(n)}
                  style={[styles.chip, { backgroundColor: active ? primary : surface, borderColor: active ? primary : border }]}
                >
                  <Text style={[styles.chipText, { color: active ? '#FFF' : text }]}>{n}</Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => { setShowCustom(true); setCustomInput(String(value.value)); }}
              style={[styles.chip, { backgroundColor: showCustom ? primary : surface, borderColor: showCustom ? primary : border }]}
            >
              <Text style={[styles.chipText, { color: showCustom ? '#FFF' : text }]}>Custom</Text>
            </Pressable>
          </ScrollView>
          {showCustom && (
            <View style={styles.customRow}>
              <TextInput
                value={customInput}
                onChangeText={setCustomInput}
                keyboardType="number-pad"
                placeholder="1–365"
                placeholderTextColor={subText}
                style={[styles.customInput, { backgroundColor: surface, borderColor: border, color: inputText }]}
                onSubmitEditing={handleCustomSubmit}
                onFocus={onCustomInputFocus}
                returnKeyType="done"
                maxLength={3}
              />
              <Pressable onPress={handleCustomSubmit} style={[styles.customConfirm, { backgroundColor: primary }]}>
                <Text style={styles.customConfirmText}>Set</Text>
              </Pressable>
            </View>
          )}
          <Text style={[styles.valueSummary, { color: subText }]}>
            {value.type === 'streak'
              ? `Target: ${value.value}-day streak`
              : `Target: ${value.value} completions`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    width: '47%',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeTextCol: { flex: 1, gap: 2 },
  typeLabel: { fontFamily: 'DMSans_700Bold', fontSize: 14 },
  typeDesc: { fontFamily: 'DMSans_400Regular', fontSize: 11.5, lineHeight: 15 },
  dayRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  dayPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillText: { fontFamily: 'DMSans_700Bold', fontSize: 13 },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  chip: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontFamily: 'DMSans_700Bold', fontSize: 14 },
  customRow: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'center' },
  customInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  customConfirm: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customConfirmText: { fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#FFF' },
  valueSummary: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});
