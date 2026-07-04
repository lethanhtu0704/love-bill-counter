# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js + Turbopack) at http://localhost:3000
npm run build    # Production build (runs Serwist service-worker generation)
npm run start    # Serve the production build
npm run lint     # ESLint (eslint-config-next: core-web-vitals + typescript)
```

There is no test suite. Verify changes by running the app.

## Architecture

This is a single Next.js (16, App Router, React 19) PWA bundling several independent features under `src/app/`: **love-counter**, **room-bill**, **meal-planner**, **music**, and **gold**. Firebase Realtime Database is the backing store for all of them.

**`ARCHITECTURE.md` is the authoritative, detailed reference** — read it for feature flows, data paths, and the rationale behind patterns. Key points to know before editing:

- **Feature pages are split**: `page.tsx` is a thin wrapper that `next/dynamic`-imports the real `*Page.tsx` with `{ ssr: false }`. Room Bill modals are likewise lazy-loaded on open. Keep new heavy/client-only feature code out of the initial bundle the same way.
- **Keep the root layout shell lean**: no `framer-motion` in `BottomNavBar` or layout (CSS transitions only); animation libs live in feature pages.
- **Data access is centralized**: `src/lib/services.ts` wraps all RTDB reads/writes as typed helpers (no `any`; updates use `Record<string, unknown>`). RTDB collection/doc names and feature constants live in `src/lib/constants.ts` — reference these, don't hardcode strings/paths.
- **Client vs server Firebase**: `src/lib/firebase.ts` (client SDK) vs `src/lib/firebaseAdmin.ts` (admin SDK, server only). API routes under `src/app/api/` use admin; UI mutations may use Server Actions (e.g. `love-counter/actions.ts`).
- **Shared composition components**: `ModalOverlay` (overlay wrapper, composes via `children`) and `BillFormFields` (shared by create + edit bill modals). Reuse these rather than duplicating.
- **Dark mode** is class-based: brand tokens + an inverted gray ramp in `src/app/globals.css`, driven by `ThemeProvider`/`ThemeToggle`.

## Conventions

- Path alias `@/*` → `./src/*`.
- TypeScript is `strict`; avoid `any` (services layer is fully typed).
- UI copy is **Vietnamese** — match existing strings.
- Inputs/textareas use `font-size: 16px`+ to prevent iOS focus auto-zoom.
- PWA: register new static assets/pages in `src/app/sw.ts` / `src/app/serwist.ts` so offline caching stays correct.

## Environment & Deploy

- Client config: `NEXT_PUBLIC_FIREBASE_*` (see `.env.example`), plus `NEXT_PUBLIC_FIREBASE_VAPID_KEY` for web push.
- Server secrets: `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` (literal `\n` in the key is converted to real newlines), `GEMINI_API_KEY` (meal-planner AI), and `CRON_SECRET` (gold refresh auth).
- `vercel.json` runs a daily cron hitting `/api/gold/refresh` at `0 2 * * *` UTC.
