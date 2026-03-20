<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Grammify — AI Agent Coding Guidelines

> Full product spec: see `../SPEC.md` (workspace root)  
> Copilot workspace file: `.github/copilot-instructions.md` (this folder)

## What This Project Is

Bilingual (Thai/English) AI spell-checker — Next.js 15 App Router, TypeScript, Tailwind CSS v4, NextAuth v5 (Google OAuth), Puppeteer for web-scraping AI providers.

## Critical Rules

### Never break these invariants
1. **i18n**: All UI strings must have a key in **both** `th` and `en` blocks in `src/lib/i18n.ts`. Never hard-code display text.
2. **Auth guard**: Any action that writes to history must check `if (!session)` first.
3. **localStorage namespacing**: Use `grammify-history-${userId}` for signed-in users, `grammify-history` for guests.
4. **effectiveText**: The corrected text shown to the user and copied to clipboard is `effectiveText` (derived from `correctionStatuses`), NOT `result.corrected` directly.
5. **maxDuration = 60**: Required on every API route that uses Puppeteer.

### File placement
- Page-specific React components → **inline in the page file** (`page.tsx`)
- Shared across pages → `src/components/`
- Shared logic/helpers → `src/lib/`

## Key State (Main Page `page.tsx`)

```
text                   — textarea input
result                 — CheckResult from /api/check
isLoading, error       — request state
correctionStatuses     — Record<index, 'approved'|'rejected'>   ← reset on each new check
effectiveText (memo)   — result.corrected with rejected items reverted to original
settings               — { provider, geminiApiKey, openaiApiKey } from localStorage
```

## API Route Pattern

```ts
// src/app/api/check/route.ts
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { text, provider, geminiApiKey, openaiApiKey } = await req.json();
  // validate input then dispatch to correct provider function
  // return NextResponse.json({ corrected, corrections })
}
```

## Styling Quick Reference

| Use case | Classes |
|----------|---------|
| Primary button | `bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600` |
| Success state | `bg-emerald-50 border-emerald-200 text-emerald-700` |
| Error state | `bg-red-50 border-red-200 text-red-600` |
| Warning/amber | `bg-amber-50 text-amber-600` |
| Card | `bg-white rounded-2xl border border-slate-100 shadow-lg` |
| Glass surface | `bg-white/80 backdrop-blur-sm border border-white/50` |
| Hover lift | `hover-lift` (custom utility in globals.css) |
| Fade in | `animate-fade-in` |
| Scale in | `animate-scale-in` |

## Environment Variables

```
AUTH_GOOGLE_ID        — Google OAuth client ID
AUTH_GOOGLE_SECRET    — Google OAuth client secret
AUTH_SECRET           — Random secret for NextAuth JWT (openssl rand -base64 32)
GEMINI_API_KEY        — Google Gemini API key (used by gemini-api provider)
```

