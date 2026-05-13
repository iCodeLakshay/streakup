# CLAUDE.md — StreakUp Mobile App (Expo)

## Project Overview
StreakUp is a habit streak tracking mobile app built with Expo (React Native) + TypeScript.
Users add daily habits, track streaks, get emotionally-escalating push notifications, and view streaks via a home screen widget.

---

## Tech Stack
- **Framework:** Expo SDK 51+ with expo-router (file-based routing)
- **Language:** TypeScript (strict mode — `"strict": true` in tsconfig)
- **State:** Zustand
- **Local DB:** expo-sqlite (habits/streaks) + AsyncStorage (settings/token)
- **Notifications:** expo-notifications + expo-task-manager
- **Widget:** expo-widgets (iOS) + react-native-android-widget (Android)
- **Animations:** react-native-reanimated v3 + react-native-confetti-cannon
- **Haptics:** expo-haptics
- **HTTP Client:** axios (base URL from `EXPO_PUBLIC_API_URL`)
- **Date logic:** date-fns (never use moment.js)
- **Icons:** @expo/vector-icons (Ionicons set only)

---

## Project Structure
```
streakup-app/
├── app/                    # expo-router screens (file-based)
│   ├── (tabs)/
│   │   ├── index.tsx       # Home screen
│   │   ├── settings.tsx    # Settings screen
│   ├── habit/[id].tsx      # Habit Detail screen
│   ├── onboarding/         # Onboarding screens
│   └── _layout.tsx
├── components/             # Reusable UI components
│   ├── HabitCard.tsx
│   ├── StreakFlame.tsx
│   ├── ProgressRing.tsx
│   └── sheets/             # Bottom sheet components
├── stores/                 # Zustand stores
│   ├── habitStore.ts
│   ├── settingsStore.ts
│   └── authStore.ts
├── services/               # API calls & local DB
│   ├── api.ts              # axios instance
│   ├── habitService.ts
│   ├── syncService.ts
│   └── db.ts               # expo-sqlite setup
├── hooks/                  # Custom hooks
├── utils/                  # streak.ts, date.ts, notifications.ts
├── constants/              # colors.ts, theme.ts, config.ts
├── widgets/                # Widget UI code
└── assets/
```

---

## Commands
```bash
npx expo start              # Start dev server
npx expo start --ios        # iOS simulator
npx expo start --android    # Android emulator
npx expo run:ios            # Native build iOS
npx expo run:android        # Native build Android
npx tsc --noEmit            # Type check (run before committing)
```

---

## Architecture Rules

### State Management
- All habit/streak data lives in **Zustand** (`habitStore`), hydrated from SQLite on app mount
- Never fetch from API directly in components — go through the store action → service layer
- Optimistic updates: update store immediately, sync to API in background, rollback on error
- `settingsStore` handles notification prefs, theme, last sync time

### Data Flow
```
Component → Store Action → Service (SQLite + API) → Store Update → Re-render
```

### Offline-First
- All writes go to SQLite first, then `syncService.push()` to API
- On app foreground: call `syncService.pull(lastSyncAt)` to merge server changes
- Conflict resolution: **last-write-wins** based on `updatedAt` timestamp
- Never block UI on network — all API calls are fire-and-forget with silent retry

### Streak Logic (`utils/streak.ts`)
- A streak increments when a completion exists for today's local calendar date
- A streak resets to 0 if yesterday has no completion (checked at midnight via background task)
- Always use `date-fns` with the user's local timezone for date comparisons
- `currentStreak` and `bestStreak` are cached in `StreakMeta` table — recompute only on check-in or midnight sweep

### Notifications (`utils/notifications.ts`)
- Schedule locally via `expo-notifications` — no server push in MVP
- On app launch: cancel all pending → reschedule next 7 days
- 4 time slots: 9am / 1pm / 6pm / 9pm (user-configurable in settings)
- Skip scheduling a slot if all habits are already complete
- Batch multiple overdue habits into one notification
- No notifications between 10pm–8am

---

## Design System

### Colors (`constants/colors.ts`)
```ts
export const colors = {
  primary: '#FF8C00',
  gradient: ['#FFB347', '#FF6500'],
  accent: '#FF6500',
  success: '#4CAF50',
  danger: '#E53935',
  // Light mode
  background: '#FFFFFF',
  card: '#FFF8F0',
  textPrimary: '#1A1A1A',
  textSecondary: '#9E9E9E',
  border: '#F0F0F0',
  // Dark mode
  backgroundDark: '#1A1A1A',
  cardDark: '#2A2A2A',
  textPrimaryDark: '#F5F5F5',
  textSecondaryDark: '#9E9E9E',
}
```

### UI Rules
- Min tap target: **48×48px** for all interactive elements
- Border radius: 16px cards, 12px buttons, 24px bottom sheets, 28px pill buttons
- Card shadow: `{ shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }`
- Dark mode: use `useColorScheme()` hook — never hardcode light-only colors
- Animations: completion ring fill = 300ms spring, confetti burst = 800ms, counter tick-up = 200ms
- Flame icon: grey (#CCCCCC) at 0 streak, orange at 1–6 days, red (#FF4500) at 7+ days

---

## Component Conventions
- **Functional components only** — no class components
- Props interfaces named `{ComponentName}Props`
- Use `StyleSheet.create()` — no inline styles except for dynamic values
- Bottom sheets use `@gorhom/bottom-sheet`
- All lists use `FlatList` — never `ScrollView` with `.map()` for habit lists
- `HabitCard` is the single source of truth for habit rendering — don't duplicate card UI

---

## API Integration

### Auth
- JWT stored in `AsyncStorage` under key `@streakup/token`
- Attach to every request via axios interceptor in `services/api.ts`
- On 401 response: clear token, redirect to login
- Token expiry: 7 days — refresh not implemented in MVP (re-login)

### Endpoints Used
```
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
GET  /api/v1/habits
POST /api/v1/habits
PATCH /api/v1/habits/:id
DELETE /api/v1/habits/:id
POST /api/v1/habits/:id/complete
DELETE /api/v1/habits/:id/undo
GET  /api/v1/sync/pull?since=ISO8601
POST /api/v1/sync/push
```

### Response Shapes

**Auth** — responses are NOT wrapped in `data`:
```
POST /auth/register  → { token: string, user: { id, email } }
POST /auth/login     → { token: string, user: { id, email } }
GET  /auth/me        → { user: { id, email, createdAt } }
```

**Habits** — all success responses wrapped in `{ data: ... }`:
```
GET  /habits              → { data: Habit[] }
POST /habits              → { data: Habit }
PATCH /habits/:id         → { data: Habit }
DELETE /habits/:id        → 204 No Content
POST /habits/:id/complete → { data: { completion: Completion, streak: { currentStreak: number, bestStreak: number } } }
DELETE /habits/:id/undo   → 204 No Content
```

**Sync** — all success responses wrapped in `{ data: ... }`:
```
GET  /sync/pull → { data: { habits: Habit[], completions: Completion[], deletions: { id: string, archivedAt: string }[] } }
POST /sync/push → { data: { conflicts: { type: "habit", id: string, serverRecord: Habit }[] } }
```

**All errors**:
```
{ error: string }
```

### TypeScript Interfaces

```ts
interface Habit {
  _id: string;
  userId: string;
  name: string;           // max 40 chars
  emoji: string | null;
  color: string | null;
  note: string | null;
  createdAt: string;      // ISO8601
  updatedAt: string;      // ISO8601 — used for sync conflict resolution (last-write-wins)
  archivedAt: string | null;
}

interface Completion {
  _id: string;
  habitId: string;
  userId: string;
  date: string;           // "YYYY-MM-DD" — must be client's LOCAL calendar date
  completedAt: string;    // ISO8601
  createdAt: string;      // ISO8601
}

interface StreakMeta {
  currentStreak: number;
  bestStreak: number;
}

interface AuthUser {
  id: string;
  email: string;
  createdAt?: string;     // only present on GET /me
}
```

---

## DO / DON'T

### DO
- Use `date-fns` for all date operations
- Use `expo-haptics` on every completion tap (`ImpactFeedbackStyle.Medium`)
- Guard all SQLite operations with try/catch
- Use `useFocusEffect` to refresh data when returning to Home screen
- Test streak logic edge cases: midnight boundary, DST, new day with no completion
- Send `date` as the client's local `YYYY-MM-DD` string — never UTC date

### DON'T
- Don't use `moment.js` (bundle size)
- Don't call API directly from components
- Don't use `localStorage` or `sessionStorage` (not available in RN)
- Don't block the UI thread with heavy streak computation — use `InteractionManager`
- Don't hardcode any API URLs — use `EXPO_PUBLIC_API_URL` from `.env`
- Don't use `any` type — fix the type instead
- Don't unwrap `data` at the axios level — unwrap in each service function individually

---

## Environment Variables (`.env`)
```
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
EXPO_PUBLIC_ENV=development
```

---

## Key Files to Know
| File | Purpose |
|---|---|
| `stores/habitStore.ts` | Central state — habits, completions, streaks |
| `utils/streak.ts` | All streak calculation logic |
| `utils/notifications.ts` | Schedule/cancel push notifications |
| `services/syncService.ts` | Offline-first push/pull sync logic |
| `services/db.ts` | SQLite schema + migrations |
| `constants/colors.ts` | Full design token reference |
| `app/(tabs)/index.tsx` | Home screen — start here for UI work |
