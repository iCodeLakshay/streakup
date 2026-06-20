import { useState, useRef } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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

// Simple password strength: 0-3
function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length < 6) return 0;
  let score = 1;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw) || /[^a-zA-Z0-9]/.test(pw)) score++;
  return score as 0 | 1 | 2 | 3;
}

const STRENGTH_COLORS: Record<0 | 1 | 2 | 3, string> = {
  0: '#E8E5E0',
  1: '#F97316',
  2: '#EAB308',
  3: '#22C55E',
};
const STRENGTH_LABELS: Record<0 | 1 | 2 | 3, string> = {
  0: '',
  1: 'Weak',
  2: 'Fair',
  3: 'Strong',
};

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const { register, isLoading, error, clearError } = useAuthStore();
  const { setDisplayName } = useSettingsStore();

  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState('');

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  // ── Colors ────────────────────────────────────────────────────────────────
  const bg = isDark ? '#1F1D1B' : '#FAFAF8';
  const surface1 = isDark ? '#2A2826' : '#F5F3F0';
  const border = isDark ? '#3A3835' : '#E8E5E0';
  const textPri = isDark ? '#F5F3F0' : '#1F1D1B';
  const textSec = isDark ? '#8A8780' : '#7A776F';
  const textMuted = isDark ? '#6A6762' : '#B8B5AE';
  const placeholder = isDark ? '#6A6762' : '#B8B5AE';

  const strength = passwordStrength(password);
  const displayError = localError || error;
  const canSubmit = nickname.trim().length > 0 && email.trim().length > 0 && password.length >= 6 && confirmPassword.length > 0;

  const handleRegister = async () => {
    if (isLoading) return;
    setLocalError('');
    clearError();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    try {
      await register(email, password);
      await setDisplayName(nickname.trim() || email.split('@')[0]);
      // _layout.tsx watches user + onboardingComplete and routes automatically
    } catch {
      // error set in store
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={8}
          >
            <BackChevron color={textSec} />
          </Pressable>

          {/* Heading */}
          <View style={styles.headingBlock}>
            <Text style={[styles.heading, { color: textPri }]}>Create account</Text>
            <Text style={[styles.subheading, { color: textSec }]}>Tell us your name and let's get started.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

            {/* Error banner */}
            {displayError ? (
              <View style={[styles.errorBanner, { backgroundColor: isDark ? '#2A1A1A' : '#FFF5F5', borderColor: '#FECACA' }]}>
                <Text style={[styles.errorText, { color: '#DC2626' }]}>{displayError}</Text>
              </View>
            ) : null}

            {/* Nickname */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: textMuted }]}>YOUR NAME</Text>
              <TextInput
                testID="nickname-input"
                value={nickname}
                onChangeText={(t) => { setNickname(t); setLocalError(''); }}
                placeholder="What should we call you?"
                placeholderTextColor={placeholder}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={32}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                style={[styles.input, { backgroundColor: surface1, borderColor: border, color: textPri }]}
              />
            </View>

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: textMuted }]}>EMAIL</Text>
              <TextInput
                testID="email-input"
                ref={emailRef}
                value={email}
                onChangeText={(t) => { setEmail(t); clearError(); setLocalError(''); }}
                placeholder="you@example.com"
                placeholderTextColor={placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                style={[styles.input, { backgroundColor: surface1, borderColor: border, color: textPri }]}
              />
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: textMuted }]}>PASSWORD</Text>
              <View style={[styles.inputWrap, { backgroundColor: surface1, borderColor: border }]}>
                <TextInput
                  testID="password-input"
                  ref={passwordRef}
                  value={password}
                  onChangeText={(t) => { setPassword(t); clearError(); setLocalError(''); }}
                  placeholder="At least 6 characters"
                  placeholderTextColor={placeholder}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  style={[styles.inputInner, { color: textPri }]}
                />
                <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={8} style={styles.eyeBtn}>
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={textSec}
                  />
                </Pressable>
              </View>
              {/* Strength bar */}
              {password.length > 0 && (
                <View style={styles.strengthWrap}>
                  <View style={styles.strengthBars}>
                    {([1, 2, 3] as const).map((lvl) => (
                      <View
                        key={lvl}
                        style={[
                          styles.strengthBar,
                          { backgroundColor: strength >= lvl ? STRENGTH_COLORS[strength] : (isDark ? '#3A3835' : '#E8E5E0') },
                        ]}
                      />
                    ))}
                  </View>
                  {strength > 0 && (
                    <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[strength] }]}>
                      {STRENGTH_LABELS[strength]}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Confirm password */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: textMuted }]}>CONFIRM PASSWORD</Text>
              <View style={[styles.inputWrap, { backgroundColor: surface1, borderColor: border }]}>
                <TextInput
                  testID="confirm-password-input"
                  ref={confirmRef}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setLocalError(''); }}
                  placeholder="Repeat password"
                  placeholderTextColor={placeholder}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  style={[styles.inputInner, { color: textPri }]}
                />
                <Pressable onPress={() => setShowConfirm(v => !v)} hitSlop={8} style={styles.eyeBtn}>
                  <MaterialIcons
                    name={showConfirm ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={textSec}
                  />
                </Pressable>
              </View>
            </View>

            {/* Create Account CTA */}
            <Pressable
              testID="create-account-btn"
              onPress={handleRegister}
              disabled={!canSubmit || isLoading}
              style={({ pressed }) => [
                styles.cta,
                { backgroundColor: canSubmit ? '#FF740D' : (isDark ? '#2A2826' : '#EEECEA') },
                pressed && canSubmit && { opacity: 0.88 },
              ]}
            >
              {isLoading
                ? <ActivityIndicator color={canSubmit ? '#FFFFFF' : textMuted} />
                : <Text style={[styles.ctaText, { color: canSubmit ? '#FFFFFF' : textMuted }]}>Create Account</Text>
              }
            </Pressable>

          </View>

          {/* Log in link */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: textSec }]}>Already have an account? </Text>
            <Pressable onPress={() => router.replace('/login')} hitSlop={4}>
              <Text style={[styles.footerLink, { color: '#FF740D' }]}>Login</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },

  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    marginBottom: 4,
  },

  headingBlock: { marginBottom: 32 },
  heading: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 6,
  },
  subheading: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
  },

  form: { gap: 16 },

  errorBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13.5,
    lineHeight: 19,
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

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  inputInner: {
    flex: 1,
    paddingVertical: 13,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
  },
  eyeBtn: { paddingLeft: 8 },
  eyeText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },

  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    width: 36,
    textAlign: 'right',
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

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
  },
  footerLink: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
});
