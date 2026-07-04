# Application Architecture & Overview

## 1. Project Overview
A unified Next.js web application that bundles four primary features:
1. **Love Counter:** A time-tracking feature that calculates the duration of a relationship and displays key relationship milestones.
2. **Room Bill Calculator:** A comprehensive utility for calculating, managing, and generating receipts for monthly room bills.
3. **Meal Planner:** A weekly meal planning feature (breakfast/lunch/dinner) with per-day editing and Firebase persistence.
4. **Gold Tracker:** A mobile-first PNJ gold price tracker (`Nhẫn Trơn PNJ 999.9`) with snapshot history, period comparison, and price chart.

## 2. Tech Stack & Libraries
- **Framework:** Next.js (16.x) with the **App Router** (`src/app`).
- **PWA Integration:** Serwist (`@serwist/turbopack`) for Service Worker (`src/app/sw.ts`), offline support (`src/app/~offline/page.tsx`), and caching.
- **Backend & Database:** Firebase (Client SDK: `firebase`, Server SDK: `firebase-admin`).
- **Styling:** Tailwind CSS (v4) and general CSS for specific components (`MilestoneCard.css`). For textarea or input, using font-size 16 or above to make sure ios not auto zoom when focus.
- **Animations:** Framer Motion (`framer-motion`) — used **only in Room Bill modals** (which are lazy-loaded on open), **not** in the root layout shell or the Love Counter. The Love Counter uses pure CSS entrance animations (`animate-fade-in-up` / `animate-fade-in-scale` in `globals.css`) so the page ships no animation library — this keeps scrolling/loading smooth on iPhone.
- **Drag & Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (~15 kb) — used in the Music Player library for accessible, touch-friendly song reordering.
- **Date Utilities:** `date-fns` for robust date math and formatting.
- **AI Integration:** Google GenAI SDK (`@google/genai`) for Gemini-powered meal plan generation via server-side Route Handler.

## 3. Directory Structure

```text
src/
├── app/                  # Next.js App Router root
│   ├── api/              # API Routes (Backend logic)
│   │   ├── push/         # Push notification endpoints
│   │   ├── meal-planner/ # Meal planner AI generation endpoint (Gemini)
│   │   └── gold/         # Gold tracker — fetches PNJ API and persists snapshots
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

### D. iOS / iPhone Rendering Rules (learned the hard way — keep these)
- **Never use `background-attachment: fixed` (Tailwind `bg-fixed`)**: iOS Safari doesn't composite it and repaints the full-screen image on every scroll frame → visible scroll jank. Instead, render the background on a separate `position: fixed; inset: 0` div behind the content (see `LoveCounterPage`).
- **Avoid per-item `backdrop-blur`**: each blurred element is a separate GPU pass on iOS. One blur on a single static element (e.g. the PIN card) is fine; a blur on every milestone date-chip is not — those use a near-opaque solid background instead.
- **Prefer CSS entrance animations over framer-motion for list items**: `whileInView` attaches an IntersectionObserver + spring per card. The milestone timeline uses a one-shot `animate-fade-in-up` keyframe with a small capped `animation-delay` stagger.
- **Lazy-load heavy images**: milestone photos are large base64/remote images — `loading="lazy" decoding="async"` keeps first paint fast and decodes off the critical path.
- **Slow down timers that aren't visible**: `TimeCounter` ticks every second only in the `full` format (the only one showing seconds); other formats tick once a minute.

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
- **Ingredients:** Gemini AI extracts shopping list from current week's meals via `POST /api/meal-planner/ingredients`. Results use a **3-tier cache** (in-memory → Firebase RTDB → Gemini API) keyed by a hash of the week's meals. Cached at `meal_planner_ingredients/{weekStartKey}`.
- **Storage Path:** `meal_planner/{weekStartKey}/{dayKey}` where keys use `yyyy-MM-dd`.

### C. The Room Bill Calculator (`src/app/room-bill/`)
- **Purpose:** Manage monthly housing expenses, calculate totals, and review previous bills.
- **Components:** Dashboard with `BillTable` (desktop) / `BillCardList` (mobile). Modals loaded on demand via `next/dynamic`.
- **Flow:** Dashboard loads bills + rates in parallel → Create/Edit via shared `BillFormFields` component → Receipt display via `Receipt.tsx`.

### D. The Music Player (`src/app/music/`)
- **Purpose:** Browse and play a personal music library stored in Firebase RTDB.
- **Drag & Drop Reordering:** Songs can be reordered via drag-and-drop (`@dnd-kit`). Reorder is debounced 10 s — `updateSongsOrder` writes each song's `order` field to Firebase only after the user stops dragging. Auto-scroll activates when dragging near the bottom edge of the screen (configured at `acceleration: 8`, `threshold: 0.15`). Drag handles are hidden when a search query is active.
- **Flow:** Load songs (sorted by `order`) → library view with play/disable/reorder → Now Playing view with progress, prev/next, shuffle, repeat → Mini Player overlay when browsing library.

### E. Push Notifications (`src/app/api/push/`)
- **Purpose:** Engage users by alerting them about relationship milestones.
- **Flow:** Client subscribes via `api/push/subscribe` → Token stored hashed in RTDB (`pushTokens/{sha256(token)}`) → server calls the shared `sendPushToAllDevices()` helper (`src/lib/pushServer.ts`), which dispatches via FCM `sendEachForMulticast` and prunes tokens FCM reports as dead. Two call sites share this helper: `notify-milestone/` (milestone alerts) and `gold/refresh/` (gold price alerts, §5.F) — add new push triggers through the same helper rather than re-implementing the send/cleanup loop.
- **Two notification paths:** the device that adds the milestone shows an immediate **local** notification (`notifyMilestoneAddedLocal`); every registered device (including the sender) gets the **FCM push**, displayed by the `push` handler in `sw.ts`. Both use the same `tag` so the sender doesn't see duplicates. ⚠️ This means "I saw a notification on my own phone" does **not** prove FCM works — the local path masks FCM failures.

#### Incident (2026-07): pushes only appeared on the sender's phone
- **Root cause:** `FIREBASE_ADMIN_PROJECT_ID` was set to `ext-bill-counter` (typo) instead of `next-bill-counter`. FCM's v1 send API is **scoped by project ID**, so every send failed with `messaging/mismatched-credential` ("Permission denied on resource project ext-bill-counter") — `sent: 0` for all 8 registered devices. RTDB kept working because it is scoped by `databaseURL`, not by the credential's projectId, which hid the misconfiguration everywhere else in the app. The sender still saw the local notification, making the feature look "half working".
- **Fix:**
  1. `firebaseAdmin.ts` now derives the authoritative project ID from the service-account email (`<name>@<project-id>.iam.gserviceaccount.com`) and warns + overrides when `FIREBASE_ADMIN_PROJECT_ID` doesn't match — so a wrong env value can never break FCM again. Still: correct the value in Vercel/`.env.local`.
  2. `notify-milestone` logs `sent/failed/errorsByCode` to the server console — a `200` response with `sent: 0` is otherwise invisible. **When debugging push, always check Vercel function logs for this line first.**
  3. `ensureFcmToken` (client) no longer trusts a 7-day localStorage token cache: it fetches the current token and re-POSTs `/api/push/subscribe` once per page session. FCM rotates tokens and the server prunes dead ones — a device that never re-registers becomes silently unreachable.
- **Verified** with `sendEachForMulticast(msg, dryRun: true)` against real tokens: wrong projectId → 8/8 `mismatched-credential`; corrected projectId → 7/8 success (1 genuinely stale token, which the cleanup path removes on the next real send).

#### Notes for future implementation
- **iOS requirements:** web push only works when the app is **installed to the Home Screen** (PWA) on iOS 16.4+, and permission must be requested from a **user gesture** — `ensureFcmToken` deliberately calls `Notification.requestPermission()` before any `await` so the gesture isn't lost. Each user must open Love Counter once (and tap "+ Thêm kỷ niệm mới" or already have permission) for their device to register.
- **Dry-run is the safe test:** `messaging.sendEachForMulticast(message, true)` validates credentials/tokens against the real FCM API without delivering anything — use it instead of spamming real devices.
- **`webpush.fcmOptions.link`** with a relative path (`/love-counter`) is accepted by FCM in practice; clicks are handled by the `notificationclick` handler in `sw.ts` via `data.url` anyway.
- The service worker displays pushes with its own generic `push` event handler in `sw.ts` (no Firebase config needed in the SW). If FCM payload shapes change, update that handler — it reads `notification.*` first, then `data.*`, and unwraps `data.FCM_MSG`.

### F. Gold Tracker (`src/app/gold/`)
- **Purpose:** Track the daily price of `Nhẫn Trơn PNJ 999.9` (PNJ `masp: N24K`) and surface deviation from the period low.
- **Data Source:** PNJ public endpoint `https://edge-cf-api.pnj.io/ecom-frontend/v1/get-gold-price?zone=00`. Only the N24K row is persisted — other gold types are ignored.
- **Storage:** RTDB path `gold_history/{pushId}` with `{ productCode, productName, buy, sell, sourceUpdatedAt, savedAt }`. Unit is fixed at `1.000đ/Chỉ`.
- **Refresh Rules:** `GET/POST /api/gold/refresh` fetches PNJ server-side via Firebase Admin and only writes a new snapshot when (a) `buy`/`sell` changed, or (b) the latest snapshot is from a different UTC calendar day (so daily history stays continuous).
- **Auth:** When `CRON_SECRET` is set, the endpoint accepts either `Authorization: Bearer <CRON_SECRET>` (Vercel Cron) or same-origin browser requests (the manual "Cập nhật giá" button).
- **Cron:** `vercel.json` schedules `/api/gold/refresh` daily at `0 2 * * *` UTC (≈09:00 Asia/Ho_Chi_Minh) to guarantee a baseline snapshot per day.
- **Push Notifications:** Whenever `refresh()` actually **saves** a new snapshot (real price change, or the once-per-day continuity checkpoint), the route sends a push to every subscribed device via the shared `sendPushToAllDevices` helper (`src/lib/pushServer.ts`) — no notification is sent on runs where nothing was written (e.g. redundant cron hits within the same day/price). Message copy is trend-aware, built by `buildGoldNotification()` in the route:
  - Price up: `📈 Vàng tăng lên {sell}đ/chỉ` / `Bán +{diff}đ (+{pct}%) so với hôm qua · Mua {buy}đ`
  - Price down: `📉 Vàng giảm còn {sell}đ/chỉ` / `Bán -{diff}đ (-{pct}%) so với hôm qua · Mua {buy}đ`
  - Unchanged (daily checkpoint): `💰 Vàng giữ nguyên {sell}đ/chỉ` / `Không đổi so với hôm qua · Mua {buy}đ`
  - No prior snapshot (first run ever): plain `💰 Giá vàng PNJ hôm nay` / `Mua {buy}đ · Bán {sell}đ`
  Uses `tag: "gold_price"` (separate from `milestone_added`) and deep-links to `/gold` with the PNJ icon. Triggered from both the cron hit and the manual "Cập nhật giá" button, since both go through the same `refresh()` path.
- **UI Flow:** Header (date + last `updateDate` time) → full-width refresh button (`#a23d69`) → current price card with PNJ icon → comparison summary card with period selector (`Tháng này / 7D / 30D / 90D`) computing `((currentSell - lowestSell) / lowestSell) * 100` → SVG line chart (Buy dashed, Sell solid) with `7D / 30D / 90D` selector.

## 6. Firebase & Data Flow
- `lib/firebase.ts`: Initializes the client-side Firebase app.
- `lib/firebaseAdmin.ts`: Initializes the secure server-side SDK (used in API routes).
- `lib/services.ts`: Wraps Firebase Realtime Database calls into typed helper functions. All update operations use `Record<string, unknown>` instead of `any`.
- **Server Actions vs API Routes:** Server Actions (`love-counter/actions.ts`) for direct UI mutations; API routes (`src/app/api/`) for external hooks and AI integrations.

## 7. Development & Deployment Notes
- **PWA:** The app is completely offline-capable. New static assets or pages should be registered in `sw.ts` or `serwist.ts`.
- **Environment Variables:** Firebase Admin requires `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`. Gemini AI requires `GEMINI_API_KEY`.
  - ⚠️ `FIREBASE_ADMIN_PROJECT_ID` **must** be the project the service account belongs to (the part before `.iam.gserviceaccount.com` in the client email). A mismatch breaks FCM sends only (RTDB keeps working) — see the push-notifications incident note above. `firebaseAdmin.ts` self-corrects and logs a warning, but fix the env value anyway.
- **Known heavy assets:** `public/assets/desktop-background.png` and `iphone-background.png` are ~2.15 MB each — above the Serwist precache limit, so they are fetched from the network and excluded from offline cache. Converting them to WebP/AVIF (~200 KB) would speed up first load on iPhone noticeably.
