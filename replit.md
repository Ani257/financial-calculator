# FinCalc

Offline-first Android financial toolkit built with React + Vite + TypeScript + Capacitor.

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 + TypeScript |
| Bundler | Vite 6 (target: ES2020) |
| Routing | React Router v6 (hash mode) |
| State / Persistence | Zustand + Capacitor Preferences API |
| Android bridge | Capacitor 7 |
| Styling | CSS Modules + CSS custom properties |

No Tailwind, no UI library, no backend, no cloud dependencies.

## Running the web dev server

```bash
npm run dev        # starts on http://localhost:5000
```

The Replit workflow "Start application" runs this automatically.

## Building the Android APK

### Prerequisites

- JDK 17+ installed
- Android SDK with Build Tools 34+
- `ANDROID_HOME` environment variable set

### Steps

```bash
# 1. Build the web bundle
npm run build

# 2. Sync into the Android project
npx cap sync android

# 3a. Debug APK
cd android && ./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# 3b. Release AAB (for Play Store)
cd android && ./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### minSdk

`minSdk 26` (Android 8.0, 2017) — covers >95% of active devices.

## Project structure

```
src/
├── calculators/          # Individual calculator components (added in Task #4)
├── components/
│   ├── BottomNav/        # Fixed bottom navigation
│   ├── Button/           # Primary / secondary / ghost / danger variants
│   ├── CalculatorShell/  # Wraps every calculator: header, reset, copy, export, favorites
│   ├── CategoryCard/     # Home-screen category tile
│   ├── NumericInput/     # Validated numeric field with prefix/suffix
│   └── ResultCard/       # Formatted result display
├── engine/               # Pure TS math functions (no React, no side effects) — Task #4
├── hooks/
│   ├── useBackButton.ts  # Android hardware back-button → React Router
│   └── useStores.ts      # Boot favorites + recents stores on mount
├── pages/
│   ├── Home/             # Category hub
│   ├── Business/         # Business calculator listing
│   ├── Loans/            # Loan calculator listing
│   ├── Investments/      # Investment calculator listing
│   ├── Favorites/        # Saved favorites list
│   └── Recents/          # Last 50 calculations
├── store/
│   ├── favorites.ts      # Zustand store → Capacitor Preferences
│   └── recents.ts        # Zustand store → Capacitor Preferences (capped at 50)
└── styles/
    ├── variables.css     # All design tokens (colours, spacing, radii, etc.)
    ├── reset.css         # Global reset
    └── global.css        # Utility classes
```

## Design tokens (key values)

| Token | Value |
|---|---|
| Background | `#111827` |
| Card | `#1e2a3a` |
| Primary accent | `#FF8C00` |
| Font | System font stack (zero font payload) |
| Min touch target | 44 px |

## User preferences

- No Tailwind, Bootstrap, Material UI, Chakra, or heavy UI libraries
- No Firebase, Supabase, or any cloud/backend dependencies
- System fonts only — no custom font files
- Inline SVG icons only — no icon libraries
- `Intl.NumberFormat` for all number formatting
- APK size target: single-digit MB
