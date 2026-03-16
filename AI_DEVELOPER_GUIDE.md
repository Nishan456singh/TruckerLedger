# AI Developer Guide: TruckLedger

Last updated: 2026-03-15

## 1. Project Overview

TruckLedger is a mobile expense tracking app for truck drivers (owner-operators and fleet drivers) to log daily operating costs and review spending trends.

Core problem solved:
- Drivers often track fuel, tolls, parking, food, and repair costs manually or across disconnected tools.
- This app centralizes those costs into a single mobile workflow with monthly analytics and receipt attachment support.

Current product capabilities:
- Manual expense entry with category/date/note.
- Receipt image attachment from gallery.
- Expense history with search/filter and detail editing.
- Monthly summary/report views.
- Trip profit calculator.
- Receipt gallery.
- CSV export of expense data.
- Appwrite OAuth authentication (Google/Apple).

## 2. Tech Stack

Major technologies used in this repository:

- Expo (`expo`): app runtime/build tooling and managed workflow.
- React Native (`react-native`): UI and native mobile app framework.
- TypeScript: typed app and service layer.
- Expo Router (`expo-router`): file-based navigation and route composition.
- Appwrite authentication (`appwrite` SDK): OAuth login and user/account session management.
- Appwrite Functions: server-side receipt AI parsing endpoint in `functions/receipt-ai`.
- SQLite (`expo-sqlite`): local persistent expense database.
- Camera (`expo-camera`): in-app camera capture screen.
- OCR library (`expo-text-recognition`, optional dynamic `expo-mlkit-text-recognition` path): receipt text extraction utilities.
- AI/OpenAI usage:
	- Direct client parsing via OpenAI Chat Completions in `lib/receiptAiParser.ts` (model: `gpt-4o-mini`).
	- Appwrite Function-based parsing in `functions/receipt-ai/src/index.js` (model: `gpt-4.1-mini`) invoked by the app through `lib/receiptAiFunction.ts`.

Related supporting packages:
- `expo-image-picker`, `expo-file-system`, `expo-sharing` for receipts and CSV export flows.
- `expo-auth-session`, `expo-web-browser`, `expo-apple-authentication` for auth handling.

## 3. Folder Structure and Navigation

### Main folders

- `app/`
	- Expo Router route files (screens).
	- Root app layout, auth gating, stack registration, and screen-level presentation config.
	- Includes `oauth/` callback routes for web OAuth success/failure.

- `components/`
	- Reusable UI building blocks such as buttons, cards, selectors, and receipt preview.

- `constants/`
	- Design system tokens and category metadata (`theme.ts`).

- `lib/`
	- Service/data layer and integrations:
		- Appwrite client and functions client initialization.
		- SQLite initialization and migrations.
		- Expense CRUD/statistics/export APIs.
		- OCR and AI parsing helpers.
		- Auth context/session helpers in `lib/auth/`.

- `lib/auth/` (this is the effective auth folder)
	- App auth orchestration, user session context, OAuth flows, and local session storage helpers.

- `functions/receipt-ai/`
	- Appwrite serverless function source code for AI receipt parsing.

- Database logic location
	- Schema/migrations/DB connection in `lib/db.ts`.
	- SQL query operations in `lib/expenseService.ts`.

### Expo Router navigation architecture

Navigation is file-based and controlled by layouts:

- Root layout (`app/_layout.tsx`):
	- Initializes SQLite before rendering app routes.
	- Wraps the app in `AuthProvider`.
	- Uses an `AuthGate` to redirect:
		- unauthenticated users -> `/login`
		- authenticated users on login route -> `/`
	- Defines stack screens for primary flows.

- Tabs group layout (`app/(tabs)/_layout.tsx`):
	- Uses a `Stack` for routes under `(tabs)`.
	- `app/(tabs)/index.tsx` is the dashboard home.

- Route transitions:
	- Modal presentation for `/add-expense`.
	- OAuth callback routes (`/oauth/success`, `/oauth/failure`) with no animation.

Important rule: route names are tightly coupled to file names. Renaming files breaks navigation paths.

## 4. Screen Architecture

Main screens and interactions with services/database:

- `login`
	- Uses `useAuth()` methods (`signInGoogle`, `signInApple`).
	- On successful auth, `AuthGate` routes user into app.

- `add-expense`
	- Mode picker: scan vs manual.
	- Manual form calls `addExpense()` from `lib/expenseService.ts`.
	- Optional receipt image picked via `expo-image-picker` and stored as URI.

- `expense-history`
	- Loads expenses using `getAllExpenses()`.
	- Supports search/category filtering in-memory.
	- Exports CSV via `exportExpenses()` + `expo-file-system` + `expo-sharing`.
	- Navigates to `expense-detail` with expense id.

- `expense-detail`
	- Loads single expense via `getExpenseById(id)`.
	- Edits via `updateExpense(id, payload)`.
	- Deletes via `deleteExpense(id)`.
	- Shows “detected fields” hints if scan-originated or `ocr_text` exists.

- `scan-receipt`
	- Uses `expo-camera` for capture and permission handling.
	- Current implementation captures image and logs URI; OCR/AI/autosave wiring is not yet connected in this screen.

- `monthly-summary`
	- Uses `getCurrentMonthCategoryTotals()` for current month category totals.

- `monthly-report`
	- Uses `getCategoryTotals(month, year)`, `getMonthlyTotal(month, year)`, `getMonthlyExpenses(month, year)`, `getReceiptCount(month, year)`.
	- Supports month navigation and driver stats.

- `trip-profit`
	- Local calculation utility (income minus typed expenses).
	- No DB writes currently.

- `profile`
	- Pulls user from auth context.
	- Pulls summary stats from expense service.
	- Includes CSV export and logout.

- `receipts`
	- Loads all expenses and filters those with `receipt_uri` for gallery display.

## 5. Services Layer (`lib/`)

### `lib/expenseService.ts`
- Primary data access layer for expenses.
- Provides:
	- CRUD (`addExpense`, `getAllExpenses`, `getExpenseById`, `updateExpense`, `deleteExpense`)
	- Date range and dashboard stats APIs
	- Category totals/monthly reporting APIs
	- Receipt count API
	- CSV export builder
- Handles compatibility between `receipt_uri` and `receipt_image` through SQL `COALESCE`.

### `lib/db.ts` (database initialization)
- Opens SQLite database `truckerledger.db`.
- Applies schema and safe migration checks.
- Ensures required columns exist (`receipt_image`, `ocr_text`) even for older installs.
- Creates indexes for `date` and `category`.

### `lib/auth/AuthContext.tsx`
- Global auth state provider.
- Exposes user, loading state, sign-in methods, logout, and refresh.
- Restores current user on app start using Appwrite account session.

### `lib/types.ts`
- Canonical domain models:
	- `Expense`, `ExpenseInput`, `ExpenseUpdate`
	- Category union type
	- Dashboard/category stat interfaces

### Receipt parsing files
- `lib/receiptOcr.ts`
	- Extracts text from receipt image.
	- Attempts optional MLKit runtime module first, then falls back to `expo-text-recognition`.
- `lib/receiptAiParser.ts`
	- Direct OpenAI parse helper (client-side API key path).
	- Normalizes amount/date/category output.
- `lib/receiptAiFunction.ts`
	- Calls Appwrite Function execution for server-side AI parse.
	- Normalizes and returns `{ vendor, amount, date, category }`.
- `lib/receiptIntegrationExample.ts`
	- Example helper that auto-fills expense form state using parsed OCR results.

## 6. Receipt Scanner Flow

### Current implemented flow (as of this repo state)

1. Camera capture:
	 - `app/scan-receipt.tsx` captures image URI via `CameraView.takePictureAsync()`.

2. Image storage:
	 - Manual expense flow stores selected image URI into SQLite through `addExpense()` (`receipt_uri`/`receipt_image`).

3. OCR extraction support:
	 - `lib/receiptOcr.ts` can extract text from a receipt image URI.

4. AI parse support:
	 - `lib/receiptAiFunction.ts` or `lib/receiptAiParser.ts` can convert OCR text into structured fields.

5. Form autofill support:
	 - `lib/receiptIntegrationExample.ts` shows intended form auto-population pattern.

Note: The end-to-end handoff from `scan-receipt` screen -> OCR -> parse -> `addExpense` is not fully wired in the current UI route implementation.

### Rule-based parsing and AI fallback

Hybrid strategy intended in this codebase:
- Use deterministic local processing first (OCR extraction, JSON/field normalization, category/date/amount normalization rules).
- Call AI parser only when needed to infer missing structure from noisy OCR text.

Why this reduces AI cost:
- Avoids AI calls when receipts are entered manually.
- Enables using OCR + local normalization for straightforward receipts.
- Limits paid model calls to ambiguous/unstructured cases.

## 7. Database Schema (SQLite)

Primary table: `expenses`

Main fields:
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `amount` REAL NOT NULL
- `category` TEXT NOT NULL
- `date` TEXT NOT NULL (`YYYY-MM-DD`)
- `note` TEXT DEFAULT ''
- `receipt_uri` TEXT
- `ocr_text` TEXT

Additional compatibility/meta fields currently in schema:
- `receipt_image` TEXT
- `created_at` TEXT DEFAULT `datetime('now')`

Indexes:
- `idx_expenses_date`
- `idx_expenses_category`

## 8. Appwrite Backend Usage

### Authentication

Appwrite SDK client is initialized in `lib/appwrite.ts`.

Auth usage:
- OAuth provider login via `account.createOAuth2Session` (web) or native browser session + callback token exchange.
- User profile and provider enrichment via `account.get()` and `account.listIdentities()`.
- Session teardown via `account.deleteSession("current")`.

### Appwrite Functions

The app calls Appwrite Function execution for receipt parsing:
- Client wrapper: `lib/receiptAiFunction.ts`
- Default function ID fallback exists in code and can be overridden with `EXPO_PUBLIC_APPWRITE_RECEIPT_AI_FUNCTION_ID`.

### AI receipt parsing function contract

Server code: `functions/receipt-ai/src/index.js`

Expected input body (JSON):
- One of:
	- `text`
	- `ocr_text`
	- `ocrText`
	containing OCR receipt text.

Example input:
```json
{
	"text": "... OCR receipt text ..."
}
```

Success output (HTTP 200):
```json
{
	"vendor": "Shell",
	"amount": 84.52,
	"date": "2026-03-14",
	"category": "fuel"
}
```

Failure output:
```json
{
	"error": "AI parsing failed"
}
```

Key backend behavior:
- Uses `OPENAI_API_KEY` environment variable.
- Calls OpenAI Chat Completions with strict JSON response format.
- Normalizes amount/date/category server-side before returning.

## 9. Development Guidelines (for Contributors and AI Assistants)

Mandatory guardrails:
- Do not break navigation.
	- Keep Expo Router route filenames stable unless intentionally migrating routes.
	- Update all `router.push`/`router.replace` callsites when route names change.

- Do not rewrite working code unnecessarily.
	- Prefer local, targeted edits over broad refactors.
	- Preserve existing public service function signatures unless migration is planned.

- Prefer incremental improvements.
	- Implement feature slices that are testable end-to-end.
	- For receipt scanning, wire capture -> OCR -> parse -> save in one controlled flow rather than replacing the whole stack.

- Avoid unnecessary dependencies.
	- Reuse existing Expo/Appwrite/native packages first.
	- Add libraries only when there is a concrete capability gap.

Additional practical conventions:
- Keep DB changes backward-compatible via migration checks (`PRAGMA table_info` + `ALTER TABLE`).
- Keep OpenAI calls on backend where possible for security and key management.
- Maintain clear fallback behavior when OCR/AI is unavailable.

## 10. Future Roadmap

Planned and requested feature direction:

1. AI receipt scanner
	 - Fully wire camera capture to OCR + structured extraction + add/edit review flow.

2. Bill of Lading scanner
	 - Add document capture/parsing pipeline similar to receipt architecture.

3. Trip profit tracking
	 - Extend current calculator into persisted trip-level analytics tied to expenses/income.

4. Income tracking
	 - Add income entries and unify with expense analytics for net profit reporting.

5. CSV export enhancements
	 - Expand export options (date range, category filters, richer columns) and potentially scheduled/report exports.

---

## Quick Start for Future AI Assistants

If you are implementing features in this repo, start from these files first:

- App entry/auth routing: `app/_layout.tsx`
- Dashboard and core navigation launch points: `app/(tabs)/index.tsx`
- Expense data layer: `lib/expenseService.ts`
- DB schema/migrations: `lib/db.ts`
- Auth layer: `lib/auth/AuthContext.tsx`, `lib/auth/appwriteAuth.ts`
- Receipt pipeline helpers: `lib/receiptOcr.ts`, `lib/receiptAiFunction.ts`, `lib/receiptAiParser.ts`
- Server AI contract: `functions/receipt-ai/src/index.js`

Suggested implementation order for scanner completion:
1. Wire `scan-receipt` capture output to a confirmation step.
2. Run OCR (`extractReceiptText`).
3. Run parse via Appwrite Function.
4. Route to `expense-detail`/`add-expense` prefilled for human confirmation.
5. Save final reviewed record via `addExpense` with `ocr_text` persisted.
