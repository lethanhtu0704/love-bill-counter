# Application Architecture & Overview

## 1. Project Overview
A unified Next.js web application that bundles three primary features:
1. **Love Counter:** A time-tracking feature that calculates the duration of a relationship and displays key relationship milestones.
2. **Room Bill Calculator:** A comprehensive utility for calculating, managing, and generating receipts for monthly room bills.
3. **Meal Planner:** A weekly meal planning feature (breakfast/lunch/dinner) with per-day editing and Firebase persistence.

## 2. Tech Stack & Libraries
- **Framework:** Next.js (16.x) with the **App Router** (`src/app`).
- **PWA Integration:** Serwist (`@serwist/turbopack`) for Service Worker (`src/app/sw.ts`), offline support (`src/app/~offline/page.tsx`), and caching.
- **Backend & Database:** Firebase (Client SDK: `firebase`, Server SDK: `firebase-admin`).
- **Styling:** Tailwind CSS (v4) and general CSS for specific components (`MilestoneCard.css`).
- **Animations:** Framer Motion (`framer-motion`) — used only in feature pages (love counter, room bill modals), **not** in the root layout shell to minimize initial bundle size.
- **Date Utilities:** `date-fns` for robust date math and formatting.
- **AI Integration:** Google GenAI SDK (`@google/genai`) for Gemini-powered meal plan generation via server-side Route Handler.
- **Utilities:** `react-to-print` (useful for printing or exporting Room Bill receipts).

## 3. Directory Structure

```text
src/
├── app/                  # Next.js App Router root
│   ├── api/              # API Routes (Backend logic)
│   │   ├── push/         # Push notification endpoints
│   │   └── meal-planner/ # Meal planner AI generation endpoint (Gemini)
│   ├── love-counter/     # Feature 1: Love Counter pages & components
│   ├── meal-planner/     # Feature 2: Weekly meal planning pages & components
│   │   ├── page.tsx      # Thin wrapper with next/dynamic import
│   │   └── MealPlannerPage.tsx  # Main page component (client-only)
│   ├── room-bill/        # Feature 3: Room Bill pages & components
│   │   └── dashboard/
│   │       ├── page.tsx           # Thin wrapper with next/dynamic import
│   │       ├── DashboardPage.tsx  # Main page component
│   │       └── components/
│   │           ├── BillFormFields.tsx   # Shared form fields (create + edit)
│   │           ├── BillFormModal.tsx    # Create bill (uses ModalOverlay + BillFormFields)
│   │           ├── EditBillModal.tsx    # Edit bill (uses ModalOverlay + BillFormFields)
│   │           ├── BillDetailModal.tsx  # View receipt
│   │           ├── RatesModal.tsx       # Manage service rates
│   │           ├── ConfirmDeleteModal.tsx
│   │           ├── BillTable.tsx        # Desktop table
│   │           └── BillCardList.tsx     # Mobile card list
│   ├── serwist/          # Serwist PWA API endpoints
│   ├── ~offline/         # PWA fallback offline page
│   ├── sw.ts             # Service worker entrypoint
│   └── serwist.ts        # Serwist configuration
├── components/           # Shared global components
│   ├── BottomNavBar.tsx  # Navigation bar (CSS transitions, no framer-motion)
│   ├── ModalOverlay.tsx  # Shared animated modal overlay wrapper
│   ├── Receipt.tsx       # Bill receipt display
│   └── icons.tsx         # Shared SVG icon components
├── lib/                  # Library functions, constants, and Firebase configs
│   ├── constants.ts
│   ├── firebase.ts       # Client-side Firebase initialization
│   ├── firebaseAdmin.ts  # Server-side Firebase Admin SDK
│   ├── push.ts           # FCM push notification client utilities
│   ├── services.ts       # Firebase RTDB service functions (typed, no `any`)
│   ├── types.ts          # TypeScript interfaces for all data models
│   └── utils.ts          # Formatting and helper utilities
```

## 4. Key Architecture Patterns

### A. Code-Splitting & Bundle Optimization
- All three feature pages use **`next/dynamic`** with `{ ssr: false }` for client-only rendering, reducing the initial server-rendered bundle.
- Room Bill **modals** are also dynamically imported on demand (loaded only when opened).
- **BottomNavBar** uses pure CSS transitions instead of framer-motion to keep the root layout bundle lean.
- SVG icons are extracted into a shared `icons.tsx` file and imported where needed.

### B. Shared Component Patterns
- **`ModalOverlay`**: A reusable animated overlay + container component used by all Room Bill modals. Accepts `children` for composition (no boolean prop variants).
- **`BillFormFields`**: Shared form fields component used by both `BillFormModal` (create) and `EditBillModal` (edit), eliminating ~300 lines of duplication. Accepts an `accentColor` prop for visual differentiation.

### C. Performance Patterns Applied
- **Parallel async operations** (`Promise.all`): AI meal generation saves all 7 days concurrently instead of sequentially. Push notification token cleanup avoids redundant database reads.
- **Derived state over effects**: Values computed from props/state are derived during render instead of synced via `useEffect` + `setState`.
- **Lazy state initialization**: `useState(() => ...)` for expensive initial values (e.g., browser API checks).
- **Functional setState**: Used consistently to prevent stale closures and stabilize callback references.
- **`React.memo`**: Applied to `MilestoneCard` which receives stable callbacks from the parent.
- **Stable callbacks**: `useCallback` with functional setState eliminates unnecessary re-renders of memoized children.

## 5. Key Features & Flow

### A. The Love Counter (`src/app/love-counter/`)
- **Purpose:** Track time together and display milestones.
- **Components:** 
  - `TimeCounter.tsx`: Processes the start date and visually ticks the time (years, months, days, etc.).
  - `MilestoneCard.tsx` (memoized): UI for milestone display, inline editing, and image upload.
  - `DatePickerPopover.tsx`: Custom date selector calendar.
- **Flow:** PIN authentication → Load config + milestones (config first for fast loading, milestones in background) → `TimeCounter` calculates delta → milestones shown in alternating timeline layout.

### B. The Meal Planner (`src/app/meal-planner/`)
- **Purpose:** Plan meals by week, choose a specific day, and maintain breakfast/lunch/dinner entries.
- **Flow:** User picks a week/date → loads week data from Firebase RTDB → edits meals → saves to Firebase.
- **AI Generation:** Gemini AI generates a full week's plan via `POST /api/meal-planner/generate`. Saves 7 days **in parallel** via `Promise.all`.
- **Ingredients:** Gemini AI extracts shopping list from current week's meals via `POST /api/meal-planner/ingredients`. Results are cached client-side by meals hash.
- **Storage Path:** `meal_planner/{weekStartKey}/{dayKey}` where keys use `yyyy-MM-dd`.

### C. The Room Bill Calculator (`src/app/room-bill/`)
- **Purpose:** Manage monthly housing expenses, calculate totals, and review previous bills.
- **Components:** Dashboard with `BillTable` (desktop) / `BillCardList` (mobile). Modals loaded on demand via `next/dynamic`.
- **Flow:** Dashboard loads bills + rates in parallel → Create/Edit via shared `BillFormFields` component → Receipt display via `Receipt.tsx`.

### D. Push Notifications (`src/app/api/push/`)
- **Purpose:** Engage users by alerting them about relationship milestones.
- **Flow:** Client subscribes via `api/push/subscribe` → Token stored hashed in RTDB → `notify-milestone/` dispatches via FCM → Invalid tokens cleaned up from cached snapshot (no redundant reads).

## 6. Firebase & Data Flow
- `lib/firebase.ts`: Initializes the client-side Firebase app.
- `lib/firebaseAdmin.ts`: Initializes the secure server-side SDK (used in API routes).
- `lib/services.ts`: Wraps Firebase Realtime Database calls into typed helper functions. All update operations use `Record<string, unknown>` instead of `any`.
- **Server Actions vs API Routes:** Server Actions (`love-counter/actions.ts`) for direct UI mutations; API routes (`src/app/api/`) for external hooks and AI integrations.

## 7. Development & Deployment Notes
- **PWA:** The app is completely offline-capable. New static assets or pages should be registered in `sw.ts` or `serwist.ts`.
- **Environment Variables:** Firebase Admin requires `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`. Gemini AI requires `GEMINI_API_KEY`.
