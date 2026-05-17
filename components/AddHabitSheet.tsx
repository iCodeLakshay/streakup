import { useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, Modal, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Habit } from '@/stores/habitStore';

const EMOJI_PRESETS = [
  '🔥','💪','📚','🧘','🏃','💧','🥗','😴','✍️','🎯',
  '🎸','🌿','⚡','🧠','❤️','🌅','🦷','💊','🏊','🚴',
];

const COLOR_SWATCHES = [
  '#FF740D','#FF3B30','#FF9500','#34C759',
  '#007AFF','#5856D6','#FF2D55','#8E8E93',
];

interface AddHabitSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (h: Omit<Habit, 'id' | 'createdAt'>) => void;
}

export function AddHabitSheet({ visible, onClose, onAdd }: AddHabitSheetProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🔥');
  const [color, setColor] = useState('#FF740D');
  const [note, setNote] = useState('');

  const slideY = useRef(new Animated.Value(700)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: 0, duration: 340, easing: Easing.out(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(bgOpacity, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: 700, duration: 260, easing: Easing.in(Easing.ease), useNativeDriver: true,
        }),
        Animated.timing(bgOpacity, {
          toValue: 0, duration: 220, useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const canAdd = name.trim().length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd({ name: name.trim(), emoji, color, note: note.trim() || null });
    setName(''); setNote(''); setEmoji('🔥'); setColor('#FF740D');
    onClose();
  };

  const sheetBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const handleBg = isDark ? '#48484A' : '#D1D1D6';
  const labelColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const subLabelColor = isDark ? '#999999' : '#C5BFB8';
  const inputBg = isDark ? '#2C2C2E' : '#F8F6F3';
  const inputBorder = isDark ? '#383838' : '#F0EDE8';
  const inputText = isDark ? '#F5F5F5' : '#1A1A1A';
  const placeholderColor = isDark ? '#636366' : '#C5BFB8';
  const closeBtnBg = isDark ? '#3A3A3C' : '#F0F0F0';
  const ctaDisabledBg = isDark ? '#2C2C2E' : '#F0EDE8';
  const ctaDisabledText = isDark ? '#636366' : '#C5BFB8';

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalRoot}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: bgOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Sheet panel */}
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: sheetBg, paddingBottom: insets.bottom + 20 },
            { transform: [{ translateY: slideY }] },
          ]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: handleBg }]} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: labelColor }]}>New Habit</Text>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: closeBtnBg }]}
              hitSlop={8}
            >
              <Text style={{ fontSize: 16, color: isDark ? '#EBEBF5' : '#666' }}>✕</Text>
            </Pressable>
          </View>

          {/* Emoji picker */}
          <Text style={[styles.sectionLabel, { color: subLabelColor }]}>ICON</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emojiScroll}
          >
            {EMOJI_PRESETS.map((e) => (
              <Pressable
                key={e}
                onPress={() => setEmoji(e)}
                style={[
                  styles.emojiBtn,
                  {
                    backgroundColor: emoji === e ? (isDark ? 'rgba(255,116,13,0.2)' : '#FFF3E0') : inputBg,
                    borderColor: emoji === e ? '#FF740D' : inputBorder,
                  },
                ]}
              >
                <Text style={styles.emojiBtnText}>{e}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Habit name */}
          <Text style={[styles.sectionLabel, { color: subLabelColor, marginTop: 16 }]}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Habit name"
            placeholderTextColor={placeholderColor}
            maxLength={40}
            style={[styles.nameInput, { backgroundColor: inputBg, borderColor: inputBorder, color: inputText }]}
            autoFocus={false}
          />

          {/* Note */}
          <Text style={[styles.sectionLabel, { color: subLabelColor, marginTop: 12 }]}>NOTE (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            placeholderTextColor={placeholderColor}
            style={[styles.noteInput, { backgroundColor: inputBg, borderColor: inputBorder, color: inputText }]}
            multiline
          />

          {/* Color swatches */}
          <Text style={[styles.sectionLabel, { color: subLabelColor, marginTop: 16 }]}>COLOUR</Text>
          <View style={styles.swatchRow}>
            {COLOR_SWATCHES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.swatchRing,
                  { borderColor: color === c ? c : 'transparent' },
                ]}
              >
                <View style={[styles.swatch, { backgroundColor: c }]} />
              </Pressable>
            ))}
          </View>

          {/* CTA */}
          <Pressable
            onPress={handleAdd}
            disabled={!canAdd}
            style={({ pressed }) => [
              styles.ctaBtn,
              { backgroundColor: canAdd ? '#FF740D' : ctaDisabledBg },
              canAdd && styles.ctaBtnShadow,
              pressed && canAdd && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={[styles.ctaText, { color: canAdd ? '#FFFFFF' : ctaDisabledText }]}>
              Add Habit
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  emojiScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnText: {
    fontSize: 22,
  },
  nameInput: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  noteInput: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  swatchRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  ctaBtn: {
    marginTop: 24,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnShadow: {
    shadowColor: '#FF6500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
});
