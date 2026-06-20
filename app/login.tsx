import { useState, useRef } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const displayError = localError || error;

  // ── Colors ────────────────────────────────────────────────────────────────
  const bg = isDark ? '#1F1D1B' : '#FAFAF8';
  const surface1 = isDark ? '#2A2826' : '#F5F3F0';
  const border = isDark ? '#3A3835' : '#E8E5E0';
  const textPri = isDark ? '#F5F3F0' : '#1F1D1B';
  const textSec = isDark ? '#8A8780' : '#7A776F';
  const textMuted = isDark ? '#6A6762' : '#B8B5AE';
  const placeholder = isDark ? '#6A6762' : '#B8B5AE';

  const handleLogin = async () => {
    if (!email.trim() || !password || isLoading) return;
    clearError();
    setLocalError('');
    if (!EMAIL_RE.test(email.trim())) {
      setLocalError('Enter a valid email address.');
      return;
    }
    try {
      await login(email, password);
      const { onboardingComplete } = useAuthStore.getState();
      if (onboardingComplete) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding/habit-picker' as any);
      }
    } catch {
      // error already set in store
    }
  };

  const canSubmit = email.trim().length > 0 && password.length >= 6;

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Logo */}
          <View style={styles.logoBlock}>
            <Text style={styles.logoFlame}>🔥</Text>
            <Text style={[styles.logoName, { color: textPri }]}>StreakUp</Text>
            <Text style={[styles.logoTagline, { color: textSec }]}>Build habits that stick.</Text>
          </View>

          {/* Form card */}
          <View style={styles.form}>

            {/* Error banner */}
            {displayError ? (
              <View style={[styles.errorBanner, { backgroundColor: isDark ? '#2A1A1A' : '#FFF5F5', borderColor: '#FECACA' }]}>
                <Text style={[styles.errorText, { color: '#DC2626' }]}>{displayError}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: textMuted }]}>EMAIL</Text>
              <TextInput
                testID="email-input"
                value={email}
                onChangeText={(t) => { setEmail(t); if (error) clearError(); if (localError) setLocalError(''); }}
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
              <View style={styles.fieldLabelRow}>
                <Text style={[styles.fieldLabel, { color: textMuted }]}>PASSWORD</Text>
                <Pressable onPress={() => router.push('/forgot-password' as any)} hitSlop={8}>
                  <Text style={[styles.forgotLink, { color: textSec }]}>Forgot password?</Text>
                </Pressable>
              </View>
              <View style={[styles.inputWrap, { backgroundColor: surface1, borderColor: border }]}>
                <TextInput
                  testID="password-input"
                  ref={passwordRef}
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (error) clearError(); if (localError) setLocalError(''); }}
                  placeholder="••••••••"
                  placeholderTextColor={placeholder}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  style={[styles.inputInner, { color: textPri }]}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} style={styles.eyeBtn}>
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={textSec}
                  />
                </Pressable>
              </View>
            </View>

            {/* Sign In CTA */}
            <Pressable
              testID="login-btn"
              onPress={handleLogin}
              disabled={!canSubmit || isLoading}
              style={({ pressed }) => [
                styles.cta,
                { backgroundColor: canSubmit ? '#FF740D' : (isDark ? '#2A2826' : '#EEECEA') },
                pressed && canSubmit && { opacity: 0.88 },
              ]}
            >
              {isLoading
                ? <ActivityIndicator color={canSubmit ? '#FFFFFF' : textMuted} />
                : <Text style={[styles.ctaText, { color: canSubmit ? '#FFFFFF' : textMuted }]}>Let's Go</Text>
              }
            </Pressable>

          </View>

          {/* Sign up link */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: textSec }]}>Don't have an account? </Text>
            <Pressable onPress={() => router.push('/signup' as any)} hitSlop={4}>
              <Text style={[styles.footerLink, { color: '#FF740D' }]}>Sign up</Text>
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

  logoBlock: { alignItems: 'center', marginBottom: 40 },
  logoFlame: { fontSize: 40, marginBottom: 8 },
  logoName: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 6,
  },
  logoTagline: {
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
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotLink: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
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
