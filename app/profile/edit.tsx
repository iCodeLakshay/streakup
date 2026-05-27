import { useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

function BackChevron({ color }: { color: string }) {
  return (
    <Svg width={10} height={17} viewBox="0 0 10 17" fill="none">
      <Path d="M9 1L1 8.5L9 16" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function EditProfileScreen() {
  const insets  = useSafeAreaInsets();
  const isDark  = useColorScheme() === 'dark';

  const { user }                     = useAuthStore();
  const { displayName, setDisplayName } = useSettingsStore();

  const [name, setName]       = useState(displayName);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  // ── Colors ────────────────────────────────────────────────────────────────
  const bg       = isDark ? '#1F1D1B' : '#FAFAF8';
  const surface1 = isDark ? '#2A2826' : '#F5F3F0';
  const border   = isDark ? '#3A3835' : '#E8E5E0';
  const textPri  = isDark ? '#F5F3F0' : '#1F1D1B';
  const textSec  = isDark ? '#8A8780' : '#7A776F';
  const textMut  = isDark ? '#6A6762' : '#B8B5AE';
  const placeholder = isDark ? '#6A6762' : '#B8B5AE';

  const hasChanges = name.trim() !== displayName;
  const canSave    = hasChanges && name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await setDisplayName(name.trim());
    setSaving(false);
    setSaved(true);
    setTimeout(() => router.back(), 400);
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>

      {/* Nav bar */}
      <View style={[styles.navBar, { paddingTop: insets.top + 10, backgroundColor: bg, borderBottomColor: isDark ? '#3A3835' : '#F0EDE8' }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <BackChevron color={textSec} />
          <Text style={[styles.backLabel, { color: textSec }]}>Profile</Text>
        </Pressable>
        <Text style={[styles.navTitle, { color: textPri }]}>Edit Profile</Text>
        <View style={styles.navSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.inner, { paddingBottom: insets.bottom + 32 }]}>

          {/* Display name */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, { color: textMut }]}>DISPLAY NAME</Text>
            <TextInput
              value={name}
              onChangeText={(t) => { setName(t); setSaved(false); }}
              placeholder="Your name"
              placeholderTextColor={placeholder}
              maxLength={32}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              style={[styles.input, { backgroundColor: surface1, borderColor: border, color: textPri }]}
            />
            <Text style={[styles.fieldHint, { color: textMut }]}>
              This is how you appear in the app. Your email cannot be changed here.
            </Text>
          </View>

          {/* Email (read-only) */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, { color: textMut }]}>EMAIL</Text>
            <View style={[styles.readonlyInput, { backgroundColor: surface1, borderColor: border }]}>
              <Text style={[styles.readonlyText, { color: textSec }]}>{user?.email ?? '—'}</Text>
              <Text style={[styles.readonlyBadge, { color: textMut, backgroundColor: isDark ? '#333130' : '#EEECEA' }]}>
                read-only
              </Text>
            </View>
          </View>

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            disabled={!canSave || saving}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: canSave ? (saved ? '#22C55E' : '#FF740D') : (isDark ? '#2A2826' : '#EEECEA') },
              pressed && canSave && { opacity: 0.88 },
            ]}
          >
            {saving
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={[styles.ctaText, { color: canSave ? '#FFFFFF' : textMut }]}>
                  {saved ? 'Saved!' : 'Save Changes'}
                </Text>
            }
          </Pressable>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 72,
  },
  backLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  navSpacer: { minWidth: 72 },

  inner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 20,
  },

  fieldWrap: { gap: 8 },
  fieldLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
  },
  fieldHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },

  readonlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  readonlyText: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
  },
  readonlyBadge: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },

  cta: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ctaText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
});
