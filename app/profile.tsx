import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHabitStore, getBestStreak } from '@/stores/habitStore';

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackChevron({ color }: { color: string }) {
  return (
    <Svg width={10} height={17} viewBox="0 0 10 17" fill="none">
      <Path d="M9 1L1 8.5L9 16" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PencilIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function CameraIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';

  const { user }                        = useAuthStore();
  const { displayName, avatarUri, setAvatarUri } = useSettingsStore();
  const habits          = useHabitStore((s) => s.habits);
  const completions     = useHabitStore((s) => s.completions);

  // ── Colors ────────────────────────────────────────────────────────────────
  const bg       = isDark ? '#1F1D1B' : '#FAFAF8';
  const surface1 = isDark ? '#2A2826' : '#F5F3F0';
  const surface2 = isDark ? '#333130' : '#EEECEA';
  const border   = isDark ? '#3A3835' : '#E8E5E0';
  const textPri  = isDark ? '#F5F3F0' : '#1F1D1B';
  const textSec  = isDark ? '#8A8780' : '#7A776F';
  const textMut  = isDark ? '#6A6762' : '#B8B5AE';

  // ── Derived ───────────────────────────────────────────────────────────────
  const name = displayName.trim() || user?.email?.split('@')[0] || 'You';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const allTimeCompletions = completions.length;

  const overallBest = habits.reduce(
    (max, h) => Math.max(max, getBestStreak(h.id, completions)),
    0
  );

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthCount = completions.filter((c) => c.date.startsWith(monthPrefix)).length;

  // Initials for avatar fallback
  const initials = name.slice(0, 2).toUpperCase();

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await setAvatarUri(result.assets[0].uri);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>

      {/* Nav bar */}
      <View style={[styles.navBar, { paddingTop: insets.top + 10, backgroundColor: bg, borderBottomColor: isDark ? '#3A3835' : '#F0EDE8' }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <BackChevron color={textSec} />
          <Text style={[styles.backLabel, { color: textSec }]}>Back</Text>
        </Pressable>
        <Text style={[styles.navTitle, { color: textPri }]}>Profile</Text>
        <Pressable
          style={styles.editBtn}
          onPress={() => router.push('/profile/edit' as any)}
          hitSlop={8}
        >
          <PencilIcon color={textSec} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Avatar + name hero */}
        <View style={[styles.hero, { backgroundColor: surface2, borderColor: isDark ? '#3A3835' : '#E8E5E0' }]}>
          <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
            <View style={[styles.avatarCircle, { backgroundColor: surface1, borderColor: border }]}>
              {avatarUri
                ? <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                : <Text style={[styles.avatarInitials, { color: textPri }]}>{initials}</Text>
              }
            </View>
            <View style={[styles.cameraBtn, { backgroundColor: '#FF740D' }]}>
              <CameraIcon color="#FFFFFF" />
            </View>
          </Pressable>
          <Text style={[styles.heroName, { color: textPri }]}>{name}</Text>
          <Text style={[styles.heroEmail, { color: textSec }]}>{user?.email ?? ''}</Text>
          {memberSince && (
            <Text style={[styles.heroSince, { color: textMut }]}>Member since {memberSince}</Text>
          )}
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard value={habits.length} label="Habits" surface={surface1} border={border} textPri={textPri} textMut={textMut} />
          <StatCard value={allTimeCompletions} label="All-time check-ins" surface={surface1} border={border} textPri={textPri} textMut={textMut} />
          <StatCard value={overallBest} label="Best streak" suffix="d" surface={surface1} border={border} textPri={textPri} textMut={textMut} />
          <StatCard value={thisMonthCount} label="This month" surface={surface1} border={border} textPri={textPri} textMut={textMut} />
        </View>

        {/* Habits list */}
        {habits.length > 0 && (
          <View style={styles.habitSection}>
            <Text style={[styles.sectionLabel, { color: textMut }]}>MY HABITS</Text>
            <View style={[styles.habitGroup, { borderColor: border }]}>
              {habits.map((h, i) => {
                const count = completions.filter((c) => c.habitId === h.id).length;
                return (
                  <View
                    key={h.id}
                    style={[
                      styles.habitRow,
                      { backgroundColor: surface1 },
                      i < habits.length - 1 && { borderBottomWidth: 1, borderBottomColor: border },
                    ]}
                  >
                    <Text style={styles.habitEmoji}>{h.emoji}</Text>
                    <Text style={[styles.habitName, { color: textPri }]} numberOfLines={1}>
                      {h.name}
                    </Text>
                    <Text style={[styles.habitCount, { color: textMut }]}>{count}×</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {habits.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={[styles.emptyTitle, { color: textPri }]}>No habits yet</Text>
            <Text style={[styles.emptyBody, { color: textSec }]}>
              Head to the Home tab and add your first habit.
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  value, label, suffix = '', surface, border, textPri, textMut,
}: {
  value: number; label: string; suffix?: string;
  surface: string; border: string; textPri: string; textMut: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: surface, borderColor: border }]}>
      <Text style={[styles.statValue, { color: textPri }]}>
        {value}<Text style={[styles.statSuffix, { color: textMut }]}>{suffix}</Text>
      </Text>
      <Text style={[styles.statLabel, { color: textMut }]}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

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
  editBtn: {
    minWidth: 72,
    alignItems: 'flex-end',
    paddingRight: 4,
  },

  scroll: { flexGrow: 1 },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 6,
  },
  avatarWrap: {
    marginBottom: 8,
    position: 'relative',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarInitials: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    lineHeight: 34,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    lineHeight: 25,
  },
  heroEmail: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
  },
  heroSince: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    marginTop: 2,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 20,
  },
  statCard: {
    width: '47%',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 4,
  },
  statValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 24,
    lineHeight: 28,
  },
  statSuffix: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
  },
  statLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },

  // Habits list
  habitSection: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  habitGroup: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  habitEmoji: { fontSize: 22, width: 28, textAlign: 'center' },
  habitName: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
  },
  habitCount: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
  },
  emptyBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
