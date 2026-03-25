# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run tests (Vitest)
npm run test:watch   # Watch mode
npm run eval         # Run AI eval tests
```

Run a single test file:
```bash
npx vitest run src/__tests__/your-test.ts
```

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `CRON_SECRET` (for Vercel cron jobs)

## Architecture Overview

**BandTelusur** is an Indonesian band directory with AI features. It's a Next.js 16 App Router project with Supabase (auth + DB + storage), Vercel AI SDK, and Upstash Redis.

### Data Flow

- **Supabase** is the single source of truth. Complex queries go through Supabase RPC functions (see `src/lib/queries.ts`).
- **Three Supabase clients** — use the right one:
  - `supabase-server.ts` → server components, API routes (cookie-based SSR)
  - `supabase-browser.ts` → client components
  - `supabase-admin.ts` → admin/service-role operations only
- **Auth** is managed via `AuthContext` (client-side state) + Supabase SSR middleware.

### AI Layer

All AI routes live in `src/app/api/`. Key patterns:
- **Prompts** are centralized and versioned in `src/lib/prompts.ts` — always add prompts here, never inline them.
- **AI calls are logged** via `src/lib/ai-logger.ts` (model, tokens, latency, prompt version). Always call the logger in AI routes.
- **Rate limiting** uses Upstash Redis sliding window (`src/lib/rate-limit.ts`). All AI routes must be rate-limited.
- **Agents** (multi-step AI pipelines) live in `src/app/api/agents/`.

### Internationalization

- Supports Indonesian (`id`) and English (`en`) via `next-intl` v4.
- Translation files: `messages/id.json`, `messages/en.json`.
- Locale is cookie-based (see `src/i18n/request.ts`).
- Error messages returned from API routes use Indonesian (e.g., rate limit messages).

### Routing

- `src/app/(root)/` — public pages (home, browse, band detail)
- `src/app/api/` — API routes (REST + AI)
- `src/app/api/agents/` — multi-step AI agent routes
- Dynamic routes: `/bands/[id]`, `/u/[id]`
- Most pages are async **server components**; auth/player state lives in React Context (`src/contexts/`)

### UI Components

Custom UI primitives are in `src/components/` (`Button`, `Input`, `TextArea`, `Select`, `MultiSelect`, `Badge`, `Skeleton`, etc.). Prefer these over building new primitives. Styling uses **Tailwind CSS v4**.

### Database

Migrations are in `supabase/migrations/`. The `bands` table has a `pgvector` embedding column used for semantic search via `src/lib/embeddings.ts`.
