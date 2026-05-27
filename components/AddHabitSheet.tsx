import { useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View,
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
  // Add mode
  onAdd?: (h: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  // Edit mode — provide habitToEdit to switch into edit mode
  habitToEdit?: Habit;
  onSave?: (id: string, updates: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function AddHabitSheet({ visible, onClose, onAdd, habitToEdit, onSave }: AddHabitSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isEditMode = !!habitToEdit;

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🔥');
  const [color, setColor] = useState('#FF740D');
  const [note, setNote] = useState('');

  const slideY = useRef(new Animated.Value(700)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  // Pre-fill or reset form when sheet opens or habitToEdit changes
  useEffect(() => {
    if (visible) {
      if (habitToEdit) {
        setName(habitToEdit.name);
        setEmoji(habitToEdit.emoji);
        setColor(habitToEdit.color);
        setNote(habitToEdit.note ?? '');
      } else {
        setName(''); setNote(''); setEmoji('🔥'); setColor('#FF740D');
      }
    }
  }, [visible, habitToEdit]);

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

  const canSubmit = name.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload = { name: name.trim(), emoji, color, note: note.trim() || null };
    if (isEditMode && habitToEdit && onSave) {
      onSave(habitToEdit.id, payload);
    } else if (!isEditMode && onAdd) {
      onAdd(payload);
    }
    onClose();
  };

  // ── Colors ────────────────────────────────────────────────────────────────
  const sheetBg       = isDark ? '#1C1C1E' : '#FFFFFF';
  const handleBg      = isDark ? '#48484A' : '#D1D1D6';
  const labelColor    = isDark ? '#F5F5F5' : '#1A1A1A';
  const subLabelColor = isDark ? '#999999' : '#B8B5AE';
  const inputBg       = isDark ? '#2C2C2E' : '#F5F3F0';
  const inputBorder   = isDark ? '#3A3835' : '#E8E5E0';
  const inputText     = isDark ? '#F5F5F5' : '#1F1D1B';
  const placeholder   = isDark ? '#636366' : '#B8B5AE';
  const closeBtnBg    = isDark ? '#3A3A3C' : '#F0F0F0';
  const ctaDisabledBg = isDark ? '#2C2C2E' : '#EEECEA';
  const ctaDisabledTx = isDark ? '#636366' : '#B8B5AE';

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>

      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: bgOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* KAV wraps only the sheet */}
      <KeyboardAvoidingView
        style={styles.kavContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: sheetBg, maxHeight: windowHeight * 0.92 },
            { transform: [{ translateY: slideY }] },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: handleBg }]} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: labelColor }]}>
              {isEditMode ? 'Edit Habit' : 'New Habit'}
            </Text>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: closeBtnBg }]}
              hitSlop={8}
            >
              <Text style={{ fontSize: 16, color: isDark ? '#EBEBF5' : '#666' }}>✕</Text>
            </Pressable>
          </View>

          {/* Scrollable form body */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollBody, { paddingBottom: insets.bottom + 24 }]}
          >

            {/* Emoji picker */}
            <Text style={[styles.sectionLabel, { color: subLabelColor }]}>ICON</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
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
            <Text style={[styles.sectionLabel, { color: subLabelColor, marginTop: 20 }]}>NAME</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Habit name"
              placeholderTextColor={placeholder}
              maxLength={40}
              style={[styles.nameInput, { backgroundColor: inputBg, borderColor: inputBorder, color: inputText }]}
              returnKeyType="next"
            />

            {/* Note */}
            <Text style={[styles.sectionLabel, { color: subLabelColor, marginTop: 16 }]}>NOTE (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor={placeholder}
              style={[styles.noteInput, { backgroundColor: inputBg, borderColor: inputBorder, color: inputText }]}
              multiline
              returnKeyType="done"
              blurOnSubmit
            />

            {/* Color swatches */}
            <Text style={[styles.sectionLabel, { color: subLabelColor, marginTop: 20 }]}>COLOUR</Text>
            <View style={styles.swatchRow}>
              {COLOR_SWATCHES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.swatchRing, { borderColor: color === c ? c : 'transparent' }]}
                >
                  <View style={[styles.swatch, { backgroundColor: c }]} />
                </Pressable>
              ))}
            </View>

            {/* CTA */}
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.ctaBtn,
                { backgroundColor: canSubmit ? '#FF740D' : ctaDisabledBg },
                pressed && canSubmit && { opacity: 0.88 },
              ]}
            >
              <Text style={[styles.ctaText, { color: canSubmit ? '#FFFFFF' : ctaDisabledTx }]}>
                {isEditMode ? 'Save Changes' : 'Add Habit'}
              </Text>
            </Pressable>

          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  kavContainer: {
    flex: 1,
    justifyContent: 'flex-end',
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
  scrollBody: { flexGrow: 1 },
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
  emojiBtnText: { fontSize: 22 },
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
    minHeight: 72,
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
  ctaText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
});
