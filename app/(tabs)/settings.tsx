import { useState } from 'react';
import {
  Alert, Modal, Pressable, ScrollView,
  StyleSheet, Switch, Text, View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore, type ThemeMode } from '@/stores/settingsStore';
import { useHabitStore } from '@/stores/habitStore';
import { getBestStreak } from '@/stores/habitStore';

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={7} height={12} viewBox="0 0 7 12" fill="none">
      <Path d="M1 1l5 5-5 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Theme segment control ────────────────────────────────────────────────────

const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light',  value: 'light'  },
  { label: 'Dark',   value: 'dark'   },
];

function ThemeSegment({
  value, onChange, isDark, surface2, border, textPri, textMut,
}: {
  value: ThemeMode;
  onChange: (v: ThemeMode) => void;
  isDark: boolean;
  surface2: string;
  border: string;
  textPri: string;
  textMut: string;
}) {
  return (
    <View style={[styles.segment, { backgroundColor: surface2, borderColor: border }]}>
      {THEME_OPTIONS.map((opt, i) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.segmentBtn,
              active && [styles.segmentBtnActive, { backgroundColor: isDark ? '#2A2826' : '#FFFFFF' }],
              i < THEME_OPTIONS.length - 1 && { borderRightWidth: 1, borderRightColor: active ? 'transparent' : border },
            ]}
          >
            <Text style={[styles.segmentLabel, { color: active ? textPri : textMut }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Row components ───────────────────────────────────────────────────────────

function SectionLabel({ label, color }: { label: string; color: string }) {
  return <Text style={[styles.sectionLabel, { color }]}>{label}</Text>;
}

function SettingsRow({
  label, value, onPress, isDark, surface1, border, textPri, textSec,
  last = false, destructive = false,
  right,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  isDark: boolean;
  surface1: string;
  border: string;
  textPri: string;
  textSec: string;
  last?: boolean;
  destructive?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: surface1, borderBottomColor: border },
        !last && { borderBottomWidth: 1 },
        pressed && onPress && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.rowLabel, { color: destructive ? '#DC2626' : textPri }]}>
        {label}
      </Text>
      {right !== undefined ? (
        right
      ) : value ? (
        <View style={styles.rowRight}>
          <Text style={[styles.rowValue, { color: textSec }]}>{value}</Text>
          {onPress && <ChevronRight color={textSec} />}
        </View>
      ) : onPress ? (
        <ChevronRight color={destructive ? '#DC2626' : textSec} />
      ) : null}
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';

  const { user, logout }                                                            = useAuthStore();
  const { displayName, themeMode, notificationsEnabled, setThemeMode, setNotificationsEnabled } = useSettingsStore();
  const habits      = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // ── Colors ────────────────────────────────────────────────────────────────
  const bg       = isDark ? '#1F1D1B' : '#FAFAF8';
  const surface1 = isDark ? '#2A2826' : '#F5F3F0';
  const surface2 = isDark ? '#333130' : '#EEECEA';
  const border   = isDark ? '#3A3835' : '#E8E5E0';
  const textPri  = isDark ? '#F5F3F0' : '#1F1D1B';
  const textSec  = isDark ? '#8A8780' : '#7A776F';
  const textMut  = isDark ? '#6A6762' : '#B8B5AE';

  // ── Derived stats ─────────────────────────────────────────────────────────
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/login' as any);
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: bg }]}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.screenTitle, { color: textPri }]}>Settings</Text>

      {/* ── Profile ── */}
      <SectionLabel label="PROFILE" color={textMut} />
      <Pressable
        style={({ pressed }) => [styles.profileCard, { backgroundColor: surface1, borderColor: border }, pressed && { opacity: 0.75 }]}
        onPress={() => router.push('/profile' as any)}
      >
        <View style={[styles.avatar, { backgroundColor: surface2 }]}>
          <Text style={styles.avatarInitials}>
            {(displayName.trim() || user?.email?.split('@')[0] || 'Y').slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: textPri }]} numberOfLines={1}>
            {displayName.trim() || user?.email?.split('@')[0] || 'You'}
          </Text>
          <Text style={[styles.profileSub, { color: textSec }]} numberOfLines={1}>
            {user?.email ?? '—'}
          </Text>
        </View>
        <ChevronRight color={textSec} />
      </Pressable>

      {/* ── Overview ── */}
      <SectionLabel label="OVERVIEW" color={textMut} />
      <View style={[styles.group, { borderColor: border }]}>
        <SettingsRow
          label="Habits"
          value={String(habits.length)}
          isDark={isDark} surface1={surface1} border={border} textPri={textPri} textSec={textSec}
        />
        <SettingsRow
          label="Total check-ins"
          value={String(completions.length)}
          isDark={isDark} surface1={surface1} border={border} textPri={textPri} textSec={textSec}
          last
        />
      </View>

      {/* ── Appearance ── */}
      <SectionLabel label="APPEARANCE" color={textMut} />
      <View style={[styles.group, { borderColor: border }]}>
        <View style={[styles.row, { backgroundColor: surface1 }]}>
          <Text style={[styles.rowLabel, { color: textPri }]}>Theme</Text>
          <ThemeSegment
            value={themeMode}
            onChange={setThemeMode}
            isDark={isDark}
            surface2={surface2}
            border={border}
            textPri={textPri}
            textMut={textMut}
          />
        </View>
      </View>

      {/* ── Notifications ── */}
      <SectionLabel label="NOTIFICATIONS" color={textMut} />
      <View style={[styles.group, { borderColor: border }]}>
        <SettingsRow
          label="Daily reminders"
          isDark={isDark} surface1={surface1} border={border} textPri={textPri} textSec={textSec}
          last
          right={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: isDark ? '#3A3835' : '#E8E5E0', true: '#FF740D' }}
              thumbColor="#FFFFFF"
            />
          }
        />
      </View>

      {/* ── Account ── */}
      <SectionLabel label="ACCOUNT" color={textMut} />
      <View style={[styles.group, { borderColor: border }]}>
        <SettingsRow
          label="Sign Out"
          onPress={() => setShowLogoutModal(true)}
          isDark={isDark} surface1={surface1} border={border} textPri={textPri} textSec={textSec}
          last
        />
      </View>

      {/* ── App info ── */}
      <Text style={[styles.appVersion, { color: textMut }]}>StreakUp · v1.0.0</Text>

      {/* Sign out confirmation */}
      <Modal visible={showLogoutModal} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowLogoutModal(false)}>
          <Pressable style={[styles.confirmCard, { backgroundColor: isDark ? '#2A2826' : '#FFFFFF' }]}>
            <Text style={[styles.confirmTitle, { color: textPri }]}>Sign out?</Text>
            <Text style={[styles.confirmBody, { color: textSec }]}>
              Your habits and history are saved locally and will be here when you sign back in.
            </Text>
            <View style={styles.confirmButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmCancel,
                  { backgroundColor: surface2, borderColor: border },
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.confirmCancelText, { color: textPri }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.confirmAction, pressed && { opacity: 0.8 }]}
                onPress={handleLogout}
              >
                <Text style={styles.confirmActionText}>Sign Out</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  screenTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 24,
  },

  sectionLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 20,
    marginLeft: 4,
  },

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitials: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    lineHeight: 22,
  },
  profileInfo: { flex: 1, gap: 3 },
  profileName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
  profileSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
  },

  // Row group
  group: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    minHeight: 52,
  },
  rowLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValue: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
  },

  // Theme segment
  segment: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    height: 32,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  segmentBtnActive: {
    borderRadius: 7,
    margin: 2,
  },
  segmentLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },

  // App version
  appVersion: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  confirmTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
  },
  confirmBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  confirmCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
  confirmAction: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FF740D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmActionText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
