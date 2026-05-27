# StreakUp Design System

Register: **product** — design serves the task, not the brand.
Color strategy: **Restrained** — warm neutrals + one accent at ≤10% coverage.

---

## Color Tokens

### Surfaces
| Token | Value | Use |
|---|---|---|
| `surface-0` | `#FAFAF8` | Screen background |
| `surface-1` | `#F5F3F0` | Card background, input background |
| `surface-2` | `#EEECEA` | Progress card bg, hero bg, section headers |
| `surface-invert` | `#1F1D1B` | Dark mode screen background |

### Text
| Token | Value | Use |
|---|---|---|
| `text-primary` | `#1F1D1B` | Habit names, headings, stats values |
| `text-secondary` | `#7A776F` | Streak subtext, labels, nav text |
| `text-muted` | `#B8B5AE` | Section divider labels, date labels, disabled |
| `text-primary-dark` | `#F5F3F0` | Dark mode primary text |
| `text-secondary-dark` | `#8A8780` | Dark mode secondary text |

### Borders
| Token | Value | Use |
|---|---|---|
| `border-default` | `#E8E5E0` | Card borders, column dividers |
| `border-subtle` | `#F0EDE8` | Light row separators |
| `border-success` | `#A7F3D0` | Completed habit card border |

### Accent — `#FF740D` orange (≤10% of any screen)

Use ONLY for:
- Completion ring stroke (inactive state — 24px circle, stroke only)
- FAB button fill (56px circle)
- Primary CTA buttons (Get Started, All Done, Save)
- Active tab indicator dot or underline
- Motivational microcopy ("Keep going", "Start your streak!")
- Progress bar fill inside the progress card track

**Never use orange for:** backgrounds, card borders, navigation text, data/stat values,
section headers, streak count labels, decorative elements, icon colors.

### Semantic
| Token | Value | Use |
|---|---|---|
| `success` | `#22C55E` | Completion ring fill, checkmarks |
| `success-bg` | `#F0FFF4` | Completed habit card background |
| `success-border` | `#A7F3D0` | Completed habit card full-perimeter border |

---

## Typography

Two families only:
- **DM Sans** — all UI text (names, labels, buttons, data, captions)
- **DM Serif Display** — greeting heading only ("Good morning 👋")

Scale (product ratio ~1.18):

| Role | Family | Size | Weight | Tracking | Use |
|---|---|---|---|---|---|
| Display | DM Serif Display | 22px | 400 | — | Greeting heading |
| Title | DM Sans | 19px | 700 | — | Habit name in detail |
| Heading | DM Sans | 16px | 700 | — | Screen title, section heading |
| Body | DM Sans | 15px | 600 | — | Habit card name |
| Label | DM Sans | 13px | 500 | — | Streak label, secondary info |
| Caption | DM Sans | 11px | 500 | +0.8 | Section labels (ALL CAPS), timestamps |
| Data | DM Sans | 16px | 700 | — | Stats values (Best, All time) |

---

## Spacing

Base unit: 4px.

| Step | Value | Use |
|---|---|---|
| xs | 4px | Icon-label gap |
| sm | 8px | Inline element gap |
| md | 12px | Inner element spacing |
| base | 16px | Default padding |
| lg | 20px | Screen horizontal margin |
| xl | 24px | Section gap |
| 2xl | 32px | Large section spacing |

---

## Cards

- Background: `surface-1` (#F5F3F0) by default; `success-bg` (#F0FFF4) when completed
- Border: 1.5px solid `border-default` (#E8E5E0); `border-success` (#A7F3D0) when completed — **full perimeter**
- Border radius: 16px
- **No shadow** — depth via border + background contrast only
- **No side-stripe accent bar** — side-stripe borders are banned; use full border + background tint instead

### States
| State | Background | Border |
|---|---|---|
| Incomplete, streak > 0 | `surface-1` #F5F3F0 | `border-default` #E8E5E0 |
| Completed | `success-bg` #F0FFF4 | `border-success` #A7F3D0 |
| Zero-streak | `surface-1` #F5F3F0 | `border-default` #E8E5E0 |

Zero-streak: apply 0.65 opacity to the whole card.

---

## Absolute Bans

These must never appear anywhere in the app:

- **Side-stripe border** — `borderLeftWidth` or `borderRightWidth` > 1px as a colored accent on any card, row, or list item
- **Box shadow** on cards, sheets, or containers
- **Orange on text** — including streak count, stats, labels, navigation, data values
- **Orange on backgrounds** — no orange-tinted card or screen backgrounds
- **Orange borders** on cards (ring and FAB are interactive controls, not borders)
- **Gradient text** — `background-clip: text` with gradient
- **Glassmorphism** used decoratively

---

## Dark Mode

Surface and text tokens swap. Accent and semantic colors stay constant.

| Token | Light | Dark |
|---|---|---|
| screen background | `#FAFAF8` | `#1F1D1B` |
| card background | `#F5F3F0` | `#2A2826` |
| hero / progress bg | `#EEECEA` | `#333130` |
| border | `#E8E5E0` | `#3A3835` |
| text-primary | `#1F1D1B` | `#F5F3F0` |
| text-secondary | `#7A776F` | `#8A8780` |
| text-muted | `#B8B5AE` | `#6A6762` |

---

## Motion

- **Entrance**: 380ms ease-out, stagger 55ms per item
- **Ring toggle**: spring — 80ms compress, 160ms expand, 180ms settle
- **Toast slide-up**: 300ms ease-out, auto-dismiss after 2.5s
- **Confetti burst**: 800ms
- All curves: ease-out only. No bounce, no elastic, no spring overshoot.

---

## Screen Anatomy

### Home
```
Header (greeting + date + avatar)
Progress card (surface-2 bg, accent progress fill, border-subtle)
FlatList of HabitCards (10px gap)
  ├── Incomplete habits
  ├── Divider (border-subtle + text-muted label)
  └── Completed habits
FAB (accent, 56px, position absolute bottom-right)
```

### Habit Detail
```
Custom nav bar (back chevron + "Home" label in text-secondary, centered title in text-primary)
Hero section (surface-2 bg, emoji 58×58, name, streak label)
Stats row (3 columns, border-default dividers, text-primary values, text-muted labels)
"THIS WEEK" section label (caption style)
Weekly grid (7 boxes Mon–Sun, success or surface-2, day labels)
```

### Settings (planned)
```
Section headers (caption, text-muted)
Row groups (surface-1 bg, border-subtle separators)
```

---

## Icons

Ionicons set only (`@expo/vector-icons/Ionicons`).
Color: `text-secondary` or `text-primary` by default.
Orange only when the icon represents an active/primary interactive state (e.g., active tab flame).
