import { useState, useRef } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';

// ─── Google "G" icon ──────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  // ── Colors ────────────────────────────────────────────────────────────────
  const bg = isDark ? '#1F1D1B' : '#FAFAF8';
  const surface1 = isDark ? '#2A2826' : '#F5F3F0';
  const border = isDark ? '#3A3835' : '#E8E5E0';
  const textPri = isDark ? '#F5F3F0' : '#1F1D1B';
  const textSec = isDark ? '#8A8780' : '#7A776F';
  const textMuted = isDark ? '#6A6762' : '#B8B5AE';
  const placeholder = isDark ? '#6A6762' : '#B8B5AE';

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    clearError();
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
            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: isDark ? '#2A1A1A' : '#FFF5F5', borderColor: '#FECACA' }]}>
                <Text style={[styles.errorText, { color: '#DC2626' }]}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: textMuted }]}>EMAIL</Text>
              <TextInput
                value={email}
                onChangeText={(t) => { setEmail(t); if (error) clearError(); }}
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
                  ref={passwordRef}
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (error) clearError(); }}
                  placeholder="••••••••"
                  placeholderTextColor={placeholder}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  style={[styles.inputInner, { color: textPri }]}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} style={styles.eyeBtn}>
                  <Text style={[styles.eyeText, { color: textSec }]}>{showPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>

            {/* Sign In CTA */}
            <Pressable
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

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: border }]} />
              <Text style={[styles.dividerLabel, { color: textMuted }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: border }]} />
            </View>

            {/* Google button */}
            <Pressable
              style={({ pressed }) => [
                styles.googleBtn,
                { backgroundColor: surface1, borderColor: border, opacity: pressed ? 0.80 : 1 },
              ]}
              onPress={() => Alert.alert('Coming soon', 'Google sign-in is not available yet.')}
            >
              <GoogleIcon />
              <Text style={[styles.googleText, { color: textPri }]}>Continue with Google</Text>
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

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
  },

  googleBtn: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
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
