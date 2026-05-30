import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useHabitStore } from '@/stores/habitStore';
import { useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, StyleSheet, Pressable, View, Text, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Stop, Rect, Line, Polyline } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import { useColorScheme } from '@/hooks/use-color-scheme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function BellIcon({ color = '#fff', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <Path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </Svg>
  );
}

function PhoneIcon({ color = '#fff', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="5" y="2" width="14" height="20" rx="3"/>
      <Line x1="12" y1="18" x2="12.01" y2="18"/>
    </Svg>
  );
}

function ChevLeft({ color = '#1A1A1A', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 18l-6-6 6-6"/>
    </Svg>
  );
}

function CheckIcon({ color = '#fff', size = 14 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12"/>
    </Svg>
  );
}

function ArrowRight({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14M12 5l7 7-7 7"/>
    </Svg>
  );
}

function FlameWidgetIcon({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="wfg2" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#FFD966"/>
          <Stop offset="100%" stopColor="#FF6500"/>
        </LinearGradient>
      </Defs>
      <Path d="M12 2c0 6-6 8-6 14a6 6 0 0 0 12 0c0-6-6-8-6-14z" fill="url(#wfg2)" stroke="none"/>
      <Path d="M12 11c0 3-2 4-2 6a2 2 0 0 0 4 0c0-2-2-3-2-6z" fill="white" fillOpacity={0.35} stroke="none"/>
    </Svg>
  );
}

function PermCard({
  icon, title, caption, btnLabel, filled, allowed, onAllow, isDark,
}: {
  icon: React.ReactNode; title: string; caption: string;
  btnLabel: string; filled: boolean; allowed: boolean;
  onAllow: () => void; isDark: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  const cardBg = isDark ? '#2A2A2A' : '#FAFAF8';
  const cardBorder = isDark ? '#383838' : '#EEEBE6';
  const titleColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const captionColor = isDark ? '#666666' : '#A89F95';

  return (
    <View style={[styles.permCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={styles.permIconCircle}>
        {icon}
      </View>
      <View style={styles.permText}>
        <Text style={[styles.permTitle, { color: titleColor }]}>{title}</Text>
        <Text style={[styles.permCaption, { color: captionColor }]}>{caption}</Text>
      </View>
      {allowed ? (
        <View style={styles.checkCircle}>
          <CheckIcon />
        </View>
      ) : (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable
            onPress={onAllow}
            onPressIn={pressIn}
            onPressOut={pressOut}
            style={[
              styles.allowBtn,
              filled
                ? { backgroundColor: '#FF740D' }
                : { borderWidth: 1.5, borderColor: '#FF740D', backgroundColor: 'transparent' },
            ]}
          >
            <Text style={[styles.allowBtnText, { color: filled ? '#FFFFFF' : '#FF740D' }]}>
              {btnLabel}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

function WidgetPreview({ isDark, habitName, habitEmoji }: { isDark: boolean; habitName: string; habitEmoji: string }) {
  const floatY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -4, duration: 1750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 1750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const phoneBg = isDark ? '#252525' : '#F0F4F8';
  const phoneBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)';
  const labelColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(30,60,100,0.5)';
  const innerBg = isDark ? '#333333' : '#FFF8F0';
  const innerBorder = isDark ? 'rgba(255,116,13,0.25)' : 'rgba(255,116,13,0.18)';
  const habitNameColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const streakLabelColor = isDark ? '#888888' : '#A89F95';
  const dayEmpty = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)';
  const dayLabelEmpty = isDark ? '#555555' : '#C5BFB8';

  return (
    <View style={styles.widgetWrap}>
      <Animated.View
        style={[
          styles.widgetOuter,
          { backgroundColor: phoneBg, borderColor: phoneBorder },
          styles.widgetShadow,
          { transform: [{ translateY: floatY }] },
        ]}
      >
        <Text style={[styles.widgetLabel, { color: labelColor }]}>HOME SCREEN</Text>
        <View style={[styles.widgetInner, { backgroundColor: innerBg, borderColor: innerBorder }]}>
          <View style={styles.widgetHeader}>
            <Text style={styles.widgetBrand}>StreakUp</Text>
            <FlameWidgetIcon size={16} />
          </View>
          <View style={styles.widgetHabitRow}>
            <Text style={styles.widgetHabitEmoji}>{habitEmoji}</Text>
            <Text style={[styles.widgetHabitName, { color: habitNameColor }]}>{habitName}</Text>
          </View>
          <View style={styles.widgetStreakRow}>
            <Text style={styles.widgetStreakNum}>1</Text>
            <Text style={[styles.widgetStreakLabel, { color: streakLabelColor }]}>day streak</Text>
          </View>
          <View style={styles.widgetDays}>
            {DAYS.map((d, i) => (
              <View key={i} style={styles.widgetDayCol}>
                <View style={[styles.widgetDayBar, { backgroundColor: i === 1 ? '#FF740D' : dayEmpty }]} />
                <Text style={[styles.widgetDayText, { color: i === 1 ? '#FF740D' : dayLabelEmpty }]}>{d}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function WidgetInstructionModal({ visible, isDark, onClose }: { visible: boolean; isDark: boolean; onClose: () => void }) {
  const bg = isDark ? '#2A2A2A' : '#FFFFFF';
  const textColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const subtextColor = isDark ? '#888888' : '#6B6862';
  const overlayColor = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)';

  const steps = [
    { emoji: '👆', text: 'Long-press your home screen' },
    { emoji: '🔲', text: 'Tap "Widgets"' },
    { emoji: '🔍', text: 'Scroll to find StreakUp' },
    { emoji: '📌', text: 'Drag it to your home screen' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: overlayColor }]}>
        <View style={[styles.modalCard, { backgroundColor: bg }]}>
          <Text style={[styles.modalTitle, { color: textColor }]}>Add the Widget</Text>
          <Text style={[styles.modalSubtext, { color: subtextColor }]}>
            Follow these steps on your Android home screen:
          </Text>
          <View style={styles.modalSteps}>
            {steps.map((s, i) => (
              <View key={i} style={styles.modalStep}>
                <Text style={styles.modalStepEmoji}>{s.emoji}</Text>
                <Text style={[styles.modalStepText, { color: textColor }]}>{s.text}</Text>
              </View>
            ))}
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.modalBtnText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function PermissionsScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuthStore();
  const habits = useHabitStore((s) => s.habits);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [notifAllowed, setNotifAllowed] = useState(false);
  const [widgetAllowed, setWidgetAllowed] = useState(false);
  const [widgetModalVisible, setWidgetModalVisible] = useState(false);

  const firstHabit = habits[0];
  const habitName = firstHabit?.name ?? 'Morning Run';
  const habitEmoji = firstHabit?.emoji ?? '🏃';

  const fadeAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(10))).current;

  useEffect(() => {
    const delays = [0, 100, 180, 280, 380];
    Animated.parallel(
      fadeAnims.map((anim, i) =>
        Animated.parallel([
          Animated.timing(anim, { toValue: 1, duration: 450, delay: delays[i], easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(slideAnims[i], { toValue: 0, duration: 450, delay: delays[i], easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ])
      )
    ).start();
  }, []);

  const animStyle = (i: number) => ({
    opacity: fadeAnims[i],
    transform: [{ translateY: slideAnims[i] }],
  });

  const handleAllowNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Don't break your streak! 🔥",
          body: 'Check in your habits before the day ends.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 20,
          minute: 0,
        },
      });
      setNotifAllowed(true);
    }
  };

  const handleWidgetSetup = () => {
    setWidgetModalVisible(true);
  };

  const handleWidgetModalClose = () => {
    setWidgetModalVisible(false);
    setWidgetAllowed(true);
  };

  const bg = isDark ? '#1A1A1A' : '#FFFFFF';
  const navBtnBg = isDark ? '#2A2A2A' : '#FAFAFA';
  const navBtnBorder = isDark ? '#333333' : '#EBEBEB';
  const navIconColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const dotInactive = isDark ? '#444444' : '#E8E4DF';
  const headlineColor = isDark ? '#F5F5F5' : '#1A1A1A';
  const subtextColor = isDark ? '#666666' : '#A89F95';
  const footerColor = isDark ? '#555555' : '#C5BFB8';

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top }]}>

      {/* Top nav */}
      <Animated.View style={[styles.topNav, animStyle(0)]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.navBtn, { backgroundColor: navBtnBg, borderColor: navBtnBorder }]}
          hitSlop={8}
        >
          <ChevLeft color={navIconColor} />
        </Pressable>

        <View style={styles.dots}>
          {[false, false, true].map((active, i) => (
            <View
              key={i}
              style={[styles.dot, { width: active ? 20 : 6, backgroundColor: active ? '#FF740D' : dotInactive }]}
            />
          ))}
        </View>

        <View style={styles.navPlaceholder} />
      </Animated.View>

      {/* Heading */}
      <Animated.View style={[styles.heading, animStyle(1)]}>
        <Text style={[styles.headline, { color: headlineColor }]}>Never miss a day.</Text>
        <Text style={[styles.subtext, { color: subtextColor }]}>
          Set up reminders and keep your streak visible.
        </Text>
      </Animated.View>

      {/* Permission cards */}
      <Animated.View style={[styles.cards, animStyle(2)]}>
        <PermCard
          icon={<BellIcon color="#fff" size={19} />}
          title="Daily reminders"
          caption="We'll nudge you before midnight."
          btnLabel="Allow"
          filled={true}
          allowed={notifAllowed}
          onAllow={handleAllowNotifications}
          isDark={isDark}
        />
        <PermCard
          icon={<PhoneIcon color="#fff" size={19} />}
          title="Home screen widget"
          caption="See your streaks without opening the app."
          btnLabel="Set Up"
          filled={false}
          allowed={widgetAllowed}
          onAllow={handleWidgetSetup}
          isDark={isDark}
        />
      </Animated.View>

      {/* Widget preview */}
      <Animated.View style={animStyle(3)}>
        <WidgetPreview isDark={isDark} habitName={habitName} habitEmoji={habitEmoji} />
      </Animated.View>

      <View style={{ flex: 1 }} />

      {/* CTA */}
      <Animated.View style={[styles.cta, { paddingBottom: insets.bottom + 12 }, animStyle(4)]}>
        <Pressable
          onPress={async () => { await completeOnboarding(); router.replace('/(tabs)' as any); }}
          style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
        >
          <Text style={styles.ctaText}>All Done</Text>
          <ArrowRight size={18} />
        </Pressable>
        <Text style={[styles.footerText, { color: footerColor }]}>
          You can change these in Settings anytime
        </Text>
      </Animated.View>

      <WidgetInstructionModal
        visible={widgetModalVisible}
        isDark={isDark}
        onClose={handleWidgetModalClose}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPlaceholder: {
    width: 38,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 99,
  },
  heading: {
    paddingHorizontal: 24,
    paddingTop: 22,
    alignItems: 'center',
  },
  headline: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
  },
  cards: {
    marginHorizontal: 20,
    marginTop: 22,
    gap: 12,
  },
  permCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  permIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    flexShrink: 0,
    backgroundColor: '#FF740D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permText: {
    flex: 1,
    minWidth: 0,
  },
  permTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    lineHeight: 20,
  },
  permCaption: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  checkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    flexShrink: 0,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowBtn: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  allowBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13.5,
  },
  widgetWrap: {
    alignItems: 'center',
    marginTop: 20,
  },
  widgetOuter: {
    borderRadius: 22,
    padding: 16,
    width: 200,
    borderWidth: 1,
  },
  widgetShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 4,
  },
  widgetLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  widgetInner: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  widgetBrand: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    color: '#FF740D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  widgetHabitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  widgetHabitEmoji: {
    fontSize: 13,
  },
  widgetHabitName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    lineHeight: 16,
    flexShrink: 1,
  },
  widgetStreakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  widgetStreakNum: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    lineHeight: 28,
    color: '#FF740D',
  },
  widgetStreakLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  widgetDays: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  widgetDayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  widgetDayBar: {
    width: '100%',
    height: 16,
    borderRadius: 4,
  },
  widgetDayText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 7.5,
  },
  cta: {
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
  },
  ctaBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF740D',
    shadowColor: '#FF6500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaBtnPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.12,
  },
  ctaText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  footerText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
  },
  // Widget instruction modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtext: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalSteps: {
    gap: 14,
    marginBottom: 28,
  },
  modalStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  modalStepEmoji: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  modalStepText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  modalBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF740D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
