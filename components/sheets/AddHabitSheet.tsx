import { useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View,
} from 'react-native';
import EmojiKeyboard from 'rn-emoji-keyboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Habit } from '@/stores/habitStore';
import { TargetPicker, type TargetPickerValue } from '@/components/TargetPicker';

const EMOJI_PRESETS = [
  '🔥','💪','📚','🧘','🏃','💧','🥗','😴','✍️','🎯',
  '🎸','🌿','⚡','🧠','❤️','🌅','🦷','💊','🏊','🚴',
];

interface AddHabitSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd?: (h: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'serverId'>) => void;
  habitToEdit?: Habit;
  onSave?: (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'serverId'>>) => void;
}

export function AddHabitSheet({ visible, onClose, onAdd, habitToEdit, onSave }: AddHabitSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isEditMode = !!habitToEdit;

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🔥');
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [targetPicker, setTargetPicker] = useState<TargetPickerValue>({ type: 'streak', value: 30 });

  const slideY = useRef(new Animated.Value(700)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  // Prevents a rapid double-tap from submitting twice before the sheet closes.
  const submittingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      submittingRef.current = false;
      if (habitToEdit) {
        setName(habitToEdit.name);
        setEmoji(habitToEdit.emoji);
        setTargetPicker({ type: habitToEdit.targetType, value: habitToEdit.targetValue });
      } else {
        setName('');
        setEmoji('🔥');
        setTargetPicker({ type: 'streak', value: 30 });
      }
      setEmojiPickerOpen(false);
    }
  }, [visible, habitToEdit]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideY, { toValue: 0, duration: 340, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: 700, duration: 260, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const canSubmit = name.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    const payload = {
      name: name.trim(),
      emoji,
      color: '#FF740D',
      note: null as string | null,
      targetType: targetPicker.type,
      targetValue: targetPicker.value,
      targetCompletedAt: null as string | null,
    };
    if (isEditMode && habitToEdit && onSave) {
      onSave(habitToEdit.id, payload);
    } else if (!isEditMode && onAdd) {
      onAdd(payload);
    }
    onClose();
  };

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

      <Animated.View style={[styles.backdrop, { opacity: bgOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.kavContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: labelColor }]}>
              {isEditMode ? 'Edit Habit' : 'New Habit'}
            </Text>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: closeBtnBg }]} hitSlop={8}>
              <Text style={{ fontSize: 16, color: isDark ? '#EBEBF5' : '#666' }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollBody, { paddingBottom: insets.bottom + 24 }]}
          >
            {/* Icon */}
            <Text style={[styles.sectionLabel, { color: subLabelColor }]}>ICON</Text>
            <View style={styles.emojiRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.emojiScroll}
                style={styles.emojiScrollFlex}
              >
                {[emoji, ...EMOJI_PRESETS.filter((e) => e !== emoji)].map((e) => (
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
              <Pressable onPress={() => setEmojiPickerOpen(true)} style={styles.emojiAddBtn}>
                <Text style={styles.emojiAddBtnText}>+</Text>
              </Pressable>
            </View>

            <EmojiKeyboard
              open={emojiPickerOpen}
              onClose={() => setEmojiPickerOpen(false)}
              onEmojiSelected={(e) => { setEmoji(e.emoji); setEmojiPickerOpen(false); }}
              enableSearchBar
              theme={{
                backdrop: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)',
                knob: '#FF740D',
                container: isDark ? '#1C1C1E' : '#FFFFFF',
                header: isDark ? '#F5F5F5' : '#1A1A1A',
                skinTonesContainer: isDark ? '#2A2A2A' : '#F5F3F0',
                category: {
                  icon: isDark ? '#888888' : '#AAAAAA',
                  iconActive: '#FF740D',
                  container: isDark ? '#2A2A2A' : '#F5F3F0',
                  containerActive: isDark ? '#3A3A3A' : '#FFE8D6',
                },
                search: {
                  text: isDark ? '#F5F5F5' : '#1A1A1A',
                  placeholder: isDark ? '#666666' : '#AAAAAA',
                  icon: isDark ? '#888888' : '#AAAAAA',
                  background: isDark ? '#2A2A2A' : '#F5F3F0',
                },
              }}
            />

            {/* Name */}
            <Text style={[styles.sectionLabel, { color: subLabelColor, marginTop: 20 }]}>NAME</Text>
            <TextInput
              testID="habit-name-input"
              value={name}
              onChangeText={setName}
              placeholder="Habit name"
              placeholderTextColor={placeholder}
              maxLength={40}
              style={[styles.nameInput, { backgroundColor: inputBg, borderColor: inputBorder, color: inputText }]}
              returnKeyType="done"
            />

            {/* Target */}
            <Text style={[styles.sectionLabel, { color: subLabelColor, marginTop: 20 }]}>TARGET</Text>
            <TargetPicker value={targetPicker} onChange={setTargetPicker} />

            {/* CTA */}
            <Pressable
              testID="add-habit-btn"
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
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiScrollFlex: { flex: 1 },
  emojiScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
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
  emojiAddBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#FF740D',
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emojiAddBtnText: {
    fontSize: 22,
    lineHeight: 26,
    fontFamily: 'DMSans_400Regular',
    color: '#FFFFFF',
  },
  nameInput: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
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
