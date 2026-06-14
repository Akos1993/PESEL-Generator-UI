# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PESEL Generator UI** is a full-stack web application for generating and managing Polish PESEL (Powszechny Elektroniczny System Ewidencji Ludności) numbers. The app features a React frontend with accessibility support and an Express backend that proxies authenticated Supabase requests.

- **Live App:** https://purple-pond-09d0dc403.7.azurestaticapps.net
- **Tech Stack:** React 19 + TypeScript + Vite (frontend), Express 5 + Node 20 (backend), Supabase (database/storage)
- **Deployment:** Azure Static Web Apps with GitHub Actions CI/CD

## Architecture

### Frontend (`*.tsx`, `*.ts` at root + `/hooks`, `/locales`)

A React SPA built with Vite that handles the UI in four distinct views controlled by the `view` state:

- **`user`** — Main form for filling in applicant and person details (multi-section accordion-based form with 6 sections)
- **`login`** — Simple admin login (compares password hash against `ADMIN_PASS` in `constants.ts`)
- **`admin`** — View all submitted people, delete records, bulk database clear, view verification status
- **`review`** — Review/verify submitted applications (change verification status and details)

**Key files:**
- `App.tsx` — Main component; manages global state (people, form data, view routing, accessibility settings)
- `FormField.tsx` — Reusable form input component with optional TTS and speech-to-text
- `MainLayout.tsx` — Layout wrapper (header, sidebar, main content)
- `AdminView.tsx`, `ReviewView.tsx`, `LoginView.tsx` — View components
- `types.ts` — Core `Person` interface (applicant info, personal details, family info, documents, marital status, notifications)
- `constants.ts` — `ADMIN_PASS`, `TRANSLATIONS` (PL/ENG/UKR), form field definitions
- `utils.ts` — PESEL generation logic (`generatePESEL`, `getPeselExplanation`)
- `db.ts` — Supabase client library (anon key, RLS-protected; see `supabase_setup.sql` for policies)
- `hooks/useAudio.ts` — Custom hook for TTS and Web Speech API
- `locales/translations.ts` — i18n strings (imported by `constants.ts`)

**Accessibility:**
- Font scaling (1–2×, persisted to localStorage)
- High-contrast mode toggle
- Text-to-speech for form labels (using Web Audio API)
- Speech-to-text input (Web Speech API) on FormField components

### Backend (`server.ts`)

Express server that:

1. **Proxies Supabase for operations requiring `service_role` key:**
   - `GET /api/people` — Fetch all records (ordered by newest first)
   - `POST /api/people` — Upsert a person record (requires `id` field)
   - `DELETE /api/people/:id` — Delete a single record
   - `DELETE /api/people` — Clear entire table (all rows)

2. **Health check:**
   - `GET /api/health` — Tests Supabase connectivity and reports `status` (connected/disconnected/unconfigured)

3. **Static serving:**
   - Dev: Vite dev middleware (HMR enabled)
   - Prod: Serves static files from `build/` directory and SPA fallback to `index.html`

**Environment variables:**
- `SUPABASE_KEY` (recommended) — accepts both anon and service_role keys
- `SUPABASE_SERVICE_ROLE_KEY` — alias for convenience
- `SUPABASE_ANON_KEY` — alias for convenience
- `NODE_ENV=production` — triggers static file serving instead of Vite middleware

### Database (Supabase)

- **URL:** `https://jxdtfbcyqdcdpgrpzgfh.supabase.co`
- **Table:** `people` — one record per person with all form fields as columns
- **Bucket:** `Pesel` — stores ID photos and documents (base64 encoded in requests, ~15MB max per upload)
- **RLS Policies:** See `supabase_setup.sql` and `supabase_rls.sql` — anon role can read/write via strict policies; service_role can do anything
- **Key columns:** `id` (primary), `pesel`, `verificationStatus`, `createdAt`, `idPhoto`, various person/applicant fields

## Common Commands

### Development

```bash
# Start dev server (Vite HMR + Express on localhost:3000)
npm run dev

# Type check (no emit, no actual compilation)
npm run lint
```

### Building & Deployment

```bash
# Build frontend (Vite → build/) + bundle server (esbuild → dist/server.cjs)
npm run build

# Run production server (serves from build/ directory)
npm run start
```

### Single-file builds (useful for isolated testing)

```bash
# Build frontend only
npx vite build

# Type check a single file
npx tsc --noEmit utils.ts
```

## Build & Deployment Details

- **Frontend:** Vite outputs to `build/` (not `dist/`) to match Azure Static Web Apps expectations
- **Server:** esbuild bundles `server.ts` to `dist/server.cjs` with `--format=cjs` and `--packages=external`
- **CI/CD:** GitHub Actions (`.github/workflows/azure-static-web-apps-*.yml`) builds on push to main, deploys to Azure SWA
  - Passes `VITE_SUPABASE_ANON_KEY` as a GitHub secret (required for frontend Supabase client)
  - Server uses `SUPABASE_KEY` (or alias) from Azure app settings for admin operations

## Key Implementation Notes

1. **PESEL Generation:** `utils.generatePESEL()` combines birth date + gender + citizenship + checksum. See `utils.ts` for algorithm.

2. **Verification Workflow:** Admins log in, view pending applications, toggle verification status between pending/verified/rejected with optional details message.

3. **Offline Graceful Degradation:** When Supabase is unavailable, `/api/people` returns an empty array (no error thrown), and the frontend falls back to localStorage.

4. **Form State Management:** Large `formData` object in `App.tsx` mirrors the `Person` interface. Form fields are organized in accordions by section (applicant, personal, family, documents, marital, notification).

5. **RLS & Auth:** Frontend uses anon key (safe to expose); RLS policies enforce that users can only read/write their own records. Admin operations (delete all, update status) require service_role key, which stays on the backend.

6. **Localization:** Three language options (PL, ENG, UKR) persisted to localStorage. All UI strings come from `TRANSLATIONS` in `constants.ts`.

7. **Admin Credentials:** Admin password is hardcoded in `constants.ts` as `ADMIN_PASS` (hashed at compile time; never expose plaintext).

## Rules for Claude Code

- **Do not test functionality.** Do not run the dev server, run tests, or manually verify features. Code changes are assumed to be correct based on type checking and static analysis.
- **Do not run `npm run build`.** The build process is handled by GitHub Actions CI/CD on push to main. Do not attempt to build locally or verify build output.
- **No verification.** Do not verify code changes, run verification commands, or check deployment status. The developer will handle all verification manually.

## Troubleshooting

- **VITE_SUPABASE_ANON_KEY not set (build fails):** Add to GitHub Actions secret; the workflow passes it to the build step
- **Server fails to start (missing SUPABASE_KEY):** Set `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `SUPABASE_ANON_KEY` in environment
- **Supabase health check fails:** Verify URL and key are correct; check RLS policies allow the operation
- **Form not submitting:** Check that `Person.id` is set before POST (should be generated client-side, e.g., UUID)
