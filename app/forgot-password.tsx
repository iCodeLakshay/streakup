import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { api } from '@/services/api';

function BackChevron({ color }: { color: string }) {
  return (
    <Svg width={10} height={17} viewBox="0 0 10 17" fill="none">
      <Path d="M9 1L1 8.5L9 16" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircle({ color }: { color: string }) {
  return (
    <Svg width={56} height={56} viewBox="0 0 56 56" fill="none">
      <Circle cx={28} cy={28} r={27} stroke={color} strokeWidth={2} />
      <Path d="M18 28l7 7 13-13" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  // ── Colors ────────────────────────────────────────────────────────────────
  const bg         = isDark ? '#1F1D1B' : '#FAFAF8';
  const surface1   = isDark ? '#2A2826' : '#F5F3F0';
  const border     = isDark ? '#3A3835' : '#E8E5E0';
  const textPri    = isDark ? '#F5F3F0' : '#1F1D1B';
  const textSec    = isDark ? '#8A8780' : '#7A776F';
  const textMuted  = isDark ? '#6A6762' : '#B8B5AE';
  const placeholder = isDark ? '#6A6762' : '#B8B5AE';

  const canSubmit = email.trim().length > 0 && email.includes('@');

  const handleSend = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.inner, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>

          {/* Back button */}
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <BackChevron color={textSec} />
          </Pressable>

          {sent ? (
            /* ── Success state ─────────────────────────────────── */
            <View style={styles.successBlock}>
              <CheckCircle color="#22C55E" />
              <Text style={[styles.heading, { color: textPri, marginTop: 24 }]}>Check your inbox</Text>
              <Text style={[styles.successBody, { color: textSec }]}>
                We sent a password reset link to{'\n'}
                <Text style={{ color: textPri, fontFamily: 'DMSans_700Bold' }}>{email}</Text>
              </Text>
              <Text style={[styles.successHint, { color: textMuted }]}>
                Didn't receive it? Check your spam folder or try again in a few minutes.
              </Text>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.cta, { backgroundColor: '#FF740D', opacity: pressed ? 0.88 : 1, marginTop: 40 }]}
              >
                <Text style={[styles.ctaText, { color: '#FFFFFF' }]}>Back to Sign In</Text>
              </Pressable>
            </View>

          ) : (
            /* ── Form state ────────────────────────────────────── */
            <View style={styles.formBlock}>
              <Text style={[styles.heading, { color: textPri }]}>Forgot your password?</Text>
              <Text style={[styles.subheading, { color: textSec }]}>
                Enter your email and we'll send you a reset link.
              </Text>

              {error ? (
                <View style={[styles.errorBanner, { backgroundColor: isDark ? '#2A1A1A' : '#FFF5F5', borderColor: '#FECACA' }]}>
                  <Text style={[styles.errorText, { color: '#DC2626' }]}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: textMuted }]}>EMAIL</Text>
                <TextInput
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                  placeholder="you@example.com"
                  placeholderTextColor={placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                  style={[styles.input, { backgroundColor: surface1, borderColor: border, color: textPri }]}
                />
              </View>

              <Pressable
                onPress={handleSend}
                disabled={!canSubmit || isLoading}
                style={({ pressed }) => [
                  styles.cta,
                  { backgroundColor: canSubmit ? '#FF740D' : (isDark ? '#2A2826' : '#EEECEA') },
                  pressed && canSubmit && { opacity: 0.88 },
                ]}
              >
                {isLoading
                  ? <ActivityIndicator color={canSubmit ? '#FFFFFF' : textMuted} />
                  : <Text style={[styles.ctaText, { color: canSubmit ? '#FFFFFF' : textMuted }]}>Send Reset Link</Text>
                }
              </Pressable>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },

  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    marginBottom: 8,
  },

  formBlock: { gap: 20 },
  heading: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 26,
    lineHeight: 32,
  },
  subheading: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },

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

  cta: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },

  successBlock: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 8,
  },
  successBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 12,
  },
  successHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 16,
  },
});
