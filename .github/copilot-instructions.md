# Grammify — Copilot Workspace Instructions

> Read this file before writing any code in this repository.

## Project Overview

**Grammify** is a bilingual (Thai/English) AI-powered spell-checker web app.  
Users paste text, pick an AI provider (Gemini or ChatGPT), and get back a corrected version with a detailed per-correction list. Each correction can be individually **approved** or **rejected** before copying the final result.

**Live stack**: Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · NextAuth v5 (Google OAuth) · Puppeteer

---

## Repository Layout

```
grammify/                         ← Next.js project root (this folder)
├── src/
│   ├── app/
│   │   ├── layout.tsx            ← Root layout: fonts + LangProvider + Navbar + Footer
│   │   ├── page.tsx              ← Main page — spell-checker UI (ALL inline components)
│   │   ├── globals.css           ← Tailwind base + custom keyframes/animations
│   │   ├── api/
│   │   │   ├── check/route.ts    ← POST /api/check (spell-check logic, 4 AI providers)
│   │   │   └── auth/[...nextauth]/route.ts
│   │   ├── dashboard/page.tsx    ← History & analytics dashboard
│   │   └── login/page.tsx        ← Google OAuth sign-in page
│   ├── components/
│   │   ├── AuthProvider.tsx      ← SessionProvider wrapper
│   │   ├── LangProvider.tsx      ← i18n context; exposes useLang()
│   │   ├── Navbar.tsx            ← Sticky top nav
│   │   └── Footer.tsx
│   ├── lib/
│   │   ├── auth.ts               ← NextAuth config (Google provider)
│   │   └── i18n.ts               ← All UI strings (th/en) + createT helper
│   └── middleware.ts             ← NextAuth middleware
├── SPEC.md                       ← Full product spec (single source of truth)
├── .env.local                    ← AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_SECRET, GEMINI_API_KEY
└── AGENTS.md                     ← AI agent / Copilot coding guidelines
```

---

## Core Concepts & Patterns

### 1. i18n — always use `t()`
```ts
const { lang, t } = useLang();
// t('check')          → 'ตรวจสอบ' | 'Check'
// t('errorsFound', { count: 3 }) → 'พบคำผิด 3 จุด' | '3 error(s) found'
```
- All strings live in `src/lib/i18n.ts` under `th` and `en` objects.  
- **Never hard-code display text.** Add a new key to both `th` and `en` first.

### 2. Authentication (NextAuth v5)
- Session accessed via `useSession()` in client components.
- `session.user.id` is the Google OAuth sub-ID — used to namespace localStorage.
- Guard any mutating action behind `if (!session) { showToast(); return; }`.

### 3. localStorage keys
| Key | Contents |
|-----|----------|
| `grammify-settings` | `{ provider, geminiApiKey, openaiApiKey }` |
| `grammify-lang` | `'th' \| 'en'` |
| `grammify-history` | `HistoryEntry[]` (guest / no session) |
| `grammify-history-{userId}` | `HistoryEntry[]` (signed-in user) |
| `grammify-history-settings` | `{ retention: '1day' \| '1week' \| '1month' }` |

Always compute the storage key as:
```ts
const storageKey = userId ? `grammify-history-${userId}` : 'grammify-history';
```

### 4. API — POST /api/check
Request body:
```json
{
  "text": "...",
  "provider": "gemini-web | gemini-api | chatgpt-web | openai-api",
  "geminiApiKey": "(optional)",
  "openaiApiKey": "(optional)"
}
```
Response:
```json
{
  "corrected": "...",
  "corrections": [
    { "original": "...", "corrected": "...", "reason": "...", "type": "spelling|grammar|suggestion" }
  ]
}
```
- `maxDuration = 60` is set for Puppeteer providers.
- API key values are never stored server-side; they come from the client per-request.

### 5. Correction Approve / Reject (main page)
```ts
// State
const [correctionStatuses, setCorrectionStatuses] = useState<Record<number, 'approved' | 'rejected'>>({});

// Derived text shown to user and copied to clipboard
const effectiveText = useMemo(() => {
  let txt = result.corrected;
  result.corrections.forEach((c, i) => {
    if (correctionStatuses[i] === 'rejected') txt = txt.replace(c.corrected, c.original);
  });
  return txt;
}, [result, correctionStatuses]);
```
- Reset `correctionStatuses` to `{}` on every new check.
- `CorrectionCard` receives `status`, `onApprove`, `onReject` props.

### 6. Component location
- **Small, page-specific** components (e.g. `CorrectionCard`, `TypeWriter`, `FloatingOrb`, `SettingsModal`, `AIBrainAnimation`) live **inline in `page.tsx`** — do not extract to `src/components/` unless reused across pages.
- **Shared** components (`Navbar`, `Footer`, `LangProvider`, `AuthProvider`) live in `src/components/`.

---

## Styling Conventions

- **Tailwind CSS v4** — no `tailwind.config.ts`; customizations are in `globals.css`.
- Custom keyframes: `animate-float`, `animate-fade-in`, `animate-scale-in`, `animate-slide-up`, `animate-spin-slow`, `animate-gradient`.
- Utility class `hover-lift` → `transform hover:-translate-y-1 transition-all`.
- Design tokens: indigo/violet/purple gradient primary, emerald for success, red for errors, amber for warnings.
- Use `rounded-2xl` / `rounded-3xl` for cards, `rounded-xl` for inner elements, `rounded-lg` for badges/chips.
- Glass surfaces: `bg-white/80 backdrop-blur-sm border border-white/50`.

---

## TypeScript Interfaces (shared shapes)

```ts
interface Correction {
  original: string;
  corrected: string;
  reason: string;
  type?: 'spelling' | 'grammar' | 'suggestion';
}

interface CheckResult {
  original: string;
  corrected: string;
  corrections: Correction[];
  message?: string;
}

interface HistoryEntry {
  id: string;
  timestamp: number;
  originalText: string;
  correctedText: string;
  errorCount: number;
  provider: string;
  corrections: Correction[];
  userId?: string;
}

type Provider = 'gemini-web' | 'gemini-api' | 'chatgpt-web' | 'openai-api';
```

---

## Do / Don't

| Do | Don't |
|----|-------|
| Add new i18n strings to **both** `th` and `en` | Hard-code Thai or English display text |
| Guard mutations behind `if (!session)` | Allow unauthenticated writes to history |
| Use `effectiveText` for copy/display of corrected result | Use `result.corrected` directly after corrections exist |
| Keep inline components inside `page.tsx` | Move page-specific components to `src/components/` |
| Use `localStorage` for all persistence | Use server-side storage or cookies for user data |
| Add `maxDuration = 60` to any route using Puppeteer | Let Puppeteer routes time out on Vercel |
| Use Tailwind utility classes | Write raw CSS (except keyframes in globals.css) |

---

## Dev Commands

```bash
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build
npm run lint     # ESLint check
```

Environment file: `.env.local` (see `.env.example` for required keys).
