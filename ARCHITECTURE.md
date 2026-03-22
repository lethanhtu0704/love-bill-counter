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
- **Animations:** Framer Motion (`framer-motion`).
- **Date Utilities:** `date-fns` for robust date math and formatting.
- **Utilities:** `react-to-print` (useful for printing or exporting Room Bill receipts).

## 3. Directory Structure

```text
src/
├── app/                  # Next.js App Router root
│   ├── api/              # API Routes (Backend logic)
│   ├── love-counter/     # Feature 1: Love Counter pages & components
│   ├── meal-planner/     # Feature 2: Weekly meal planning pages & components
│   ├── room-bill/        # Feature 3: Room Bill pages & components
│   ├── serwist/          # Serwist PWA API endpoints
│   ├── ~offline/         # PWA fallback offline page
│   ├── sw.ts             # Service worker entrypoint
│   └── serwist.ts        # Serwist configuration
├── components/           # Shared global components (e.g., Receipt, SecretButton)
├── lib/                  # Library functions, constants, and Firebase configs
```

## 4. Key Features & Flow

### A. The Love Counter (`src/app/love-counter/`)
- **Purpose:** Track time together and display milestones.
- **Components:** 
  - `TimeCounter.tsx`: Processes the start date and visually ticks the time (years, months, days, etc.).
  - `MilestoneCard.tsx` & `DatePickerPopover.tsx`: UI for milestone display and date selection.
- **Flow:** Users visit the page -> The app retrieves the "start date" (via `actions.ts` or database) -> The `TimeCounter` calculates the delta -> `framer-motion` potentially animates these milestones.

### B. The Meal Planner (`src/app/meal-planner/`)
- **Purpose:** Plan meals by week, choose a specific day, and maintain breakfast/lunch/dinner entries.
- **Flow:** User picks a week/date -> App loads week data from Firebase Realtime Database -> User edits meals -> App writes updates back to Firebase under the selected week/day key.
- **Storage Path:** `meal_planner/{weekStartKey}/{dayKey}` where keys use `yyyy-MM-dd`.

### C. The Room Bill Calculator (`src/app/room-bill/`)
- **Purpose:** Manage monthly housing expenses, calculate totals, and review previous bills.
- **Components:** 
  - Dashboard (`DashboardPage.tsx` with `BillCardList` / `BillTable`) displays the overview.
  - Modals (`BillFormModal.tsx`, `EditBillModal.tsx`, `ConfirmDeleteModal.tsx`) handle create/update/delete flows.
  - `RatesModal.tsx`: Manages settings or base rates (e.g., electricity/water price per unit).
  - Shared `Receipt.tsx` (in `src/components/`): Likely uses `react-to-print` to generate snapshot receipts of calculated bills.
- **Flow:** Users log into the Dashboard -> Click "Add Bill" -> Fill out the `BillFormModal` with meter readings -> The app calculates costs using base rates -> Saved to Firebase -> Displays on `BillTable` -> Can be exported as a receipt.

### D. Push Notifications (`src/app/api/push/`)
- **Purpose:** Engage users by alerting them about relationship milestones or bill reminders.
- **Flow:** The client subscribes via `api/push/subscribe/route.ts` (handled through `lib/push.ts`). The `notify-milestone/` endpoint can be triggered manually or via a CRON job to dispatch notifications using `firebase-admin`.

## 5. Firebase & Data Flow
- `lib/firebase.ts`: Initializes the client-side Firebase app (Auth, Firestore, Messaging).
- `lib/firebaseAdmin.ts`: Initializes the secure server-side SDK (used in API routes for secure operations and push notifications).
- `lib/services.ts`: Wraps Firebase Realtime Database calls into reusable helper functions for retrieving and mutating app data (Love Counter, Room Bills, Meal Planner).
- **Server Actions vs API Routes:** The app utilizes both Server Actions (`love-counter/actions.ts`) for direct UI mutations and generic API routes (`src/app/api/`) for external hooks/webhooks.

## 6. Development & Deployment Notes
- **PWA:** The app is completely offline-capable. Any new static assets or pages should be registered in `sw.ts` or `serwist.ts`.
- **Environment Context:** Due to Firebase Admin, ensure proper service account credentials are provided to the environment variables (often `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`).
