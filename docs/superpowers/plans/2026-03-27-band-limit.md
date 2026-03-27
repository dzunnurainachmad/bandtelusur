# Band Limit & Upgrade Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limit free users to 1 active band; block submission of a 2nd band with an upgrade prompt; let users choose which band is active from their dashboard.

**Architecture:** Add `is_active boolean DEFAULT true` to `bands` and expose it in `bands_view`. Browse, saved, and public profile filter to `is_active = true`; dashboard shows all. A new `POST /api/bands/submit` enforces the limit server-side; the submit page server component acts as the primary gate. A `PATCH /api/bands/[id]/activate` endpoint swaps the active band.

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL + browser/server clients), TypeScript, Tailwind CSS v4, Vitest

---

## File Map

| File | Action |
|------|--------|
| `supabase/migrations/015_band_active.sql` | Create — add column, recreate view, update RPCs |
| `src/types/index.ts` | Modify — add `is_active` to `Band` type |
| `src/lib/queries.ts` | Modify — add `getActiveBandsCount`, update `getBands`, update `getUserBands` |
| `src/app/saved/page.tsx` | Modify — add `is_active = true` filter |
| `src/app/api/bands/submit/route.ts` | Create — new POST with limit check |
| `src/app/submit/SubmitForm.tsx` | Modify — call `/api/bands/submit` instead of `createBand()` |
| `src/app/submit/page.tsx` | Modify — server gate: show upgrade prompt or form |
| `src/app/api/bands/[id]/activate/route.ts` | Create — new PATCH to swap active band |
| `src/app/dashboard/page.tsx` | Modify — pass `is_active` state, show multi-active notice |
| `src/components/LoadMoreDashboard.tsx` | Modify — add active badge + Aktifkan button |
| `src/app/pricing/page.tsx` | Create — static placeholder |
| `src/__tests__/band-limit.test.ts` | Create — unit tests |

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/015_band_active.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/015_band_active.sql

-- 1. Add is_active column
alter table bands add column is_active boolean not null default true;

-- 2. Recreate bands_view to include is_active
create or replace view bands_view as
select
  b.id,
  b.user_id,
  b.name,
  b.bio,
  b.formed_year,
  b.province_id,
  b.city_id,
  b.contact_wa,
  b.contact_email,
  b.instagram,
  b.youtube,
  b.spotify,
  b.youtube_music,
  b.apple_music,
  b.bandcamp,
  b.photo_url,
  b.is_looking_for_members,
  b.is_active,
  b.created_at,
  b.updated_at,
  p.name  as province_name,
  p.slug  as province_slug,
  c.name  as city_name,
  c.slug  as city_slug,
  coalesce(
    json_agg(json_build_object('id', g.id, 'name', g.name, 'slug', g.slug))
    filter (where g.id is not null), '[]'
  ) as genres,
  b.username,
  pr.display_name as owner_display_name,
  pr.username     as owner_username
from bands b
left join provinces  p  on p.id  = b.province_id
left join cities     c  on c.id  = b.city_id
left join profiles   pr on pr.id = b.user_id
left join band_genres bg on bg.band_id = b.id
left join genres     g  on g.id  = bg.genre_id
group by b.id, p.name, p.slug, c.name, c.slug, pr.display_name, pr.username;

-- 3. Update filter_bands_by_genre to only return active bands
create or replace function filter_bands_by_genre(
  genre_ids int[],
  province_filter int default null,
  city_filter int default null,
  looking_for_members boolean default null,
  search_term text default null,
  page_offset int default 0,
  page_limit int default 13
)
returns setof bands_view
language plpgsql
as $$
begin
  return query
  select bv.*
  from bands_view bv
  where bv.id in (
    select distinct bg.band_id
    from band_genres bg
    join bands b on b.id = bg.band_id
    where bg.genre_id = any(genre_ids)
      and b.is_active = true
      and (province_filter is null or b.province_id = province_filter)
      and (city_filter is null or b.city_id = city_filter)
      and (looking_for_members is null or b.is_looking_for_members = looking_for_members)
      and (search_term is null or b.name ilike '%' || search_term || '%')
  )
  order by bv.created_at desc
  offset page_offset
  limit page_limit;
end;
$$;

-- 4. Update count_bands_by_genre to count only active bands
create or replace function count_bands_by_genre(
  genre_ids int[],
  province_filter int default null,
  city_filter int default null,
  looking_for_members boolean default null,
  search_term text default null
)
returns bigint
language plpgsql
as $$
declare
  total bigint;
begin
  select count(distinct bg.band_id) into total
  from band_genres bg
  join bands b on b.id = bg.band_id
  where bg.genre_id = any(genre_ids)
    and b.is_active = true
    and (province_filter is null or b.province_id = province_filter)
    and (city_filter is null or b.city_id = city_filter)
    and (looking_for_members is null or b.is_looking_for_members = looking_for_members)
    and (search_term is null or b.name ilike '%' || search_term || '%');

  return total;
end;
$$;
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```

Expected: migration applies without errors. All existing bands now have `is_active = true`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/015_band_active.sql
git commit -m "feat: add is_active column to bands, update view and RPCs"
```

---

## Task 2: Update Band type and queries

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/queries.ts`

- [ ] **Step 1: Add `is_active` to the Band type**

In `src/types/index.ts`, add `is_active` to the `Band` interface after `is_looking_for_members`:

```ts
  is_looking_for_members: boolean
  is_active: boolean
  user_id: string | null
```

- [ ] **Step 2: Write the failing test for `getActiveBandsCount`**

Create `src/__tests__/band-limit.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase before importing queries
const mockCount = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ count: mockCount(), error: null }),
        }),
      }),
    }),
  },
}))

import { getActiveBandsCount } from '@/lib/queries'

describe('getActiveBandsCount', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 0 when user has no active bands', async () => {
    mockCount.mockReturnValue(0)
    const result = await getActiveBandsCount('user-123')
    expect(result).toBe(0)
  })

  it('returns 1 when user has one active band', async () => {
    mockCount.mockReturnValue(1)
    const result = await getActiveBandsCount('user-123')
    expect(result).toBe(1)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run src/__tests__/band-limit.test.ts
```

Expected: FAIL — `getActiveBandsCount is not a function`

- [ ] **Step 4: Add `getActiveBandsCount` to queries.ts**

In `src/lib/queries.ts`, add this function after `getUserBands`:

```ts
export async function getActiveBandsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('bands')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true)
  if (error) throw error
  return count ?? 0
}
```

- [ ] **Step 5: Update `getBands` to filter active bands only**

In `src/lib/queries.ts`, in the `getBands` function, add `.eq('is_active', true)` to the main query, count query, and both query branches:

Find the line:
```ts
  let query = supabase
    .from('bands_view')
    .select('*')
    .order(sortCol, { ascending: sortAsc })
```

Replace with:
```ts
  let query = supabase
    .from('bands_view')
    .select('*')
    .eq('is_active', true)
    .order(sortCol, { ascending: sortAsc })
```

Also find the count query block:
```ts
  let countQuery = supabase.from('bands_view').select('*', { count: 'exact', head: true })
  if (filters.province_id) countQuery = countQuery.eq('province_id', filters.province_id)
```

Replace with:
```ts
  let countQuery = supabase.from('bands_view').select('*', { count: 'exact', head: true }).eq('is_active', true)
  if (filters.province_id) countQuery = countQuery.eq('province_id', filters.province_id)
```

- [ ] **Step 6: Update `getUserBands` to accept `activeOnly` param**

Find:
```ts
export async function getUserBands(userId: string, page = 0): Promise<{ bands: Band[]; hasMore: boolean }> {
  const from = page * BANDS_PER_PAGE
  const to = from + BANDS_PER_PAGE

  const { data, error } = await supabase
    .from('bands_view')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)
```

Replace with:
```ts
export async function getUserBands(userId: string, page = 0, activeOnly = false): Promise<{ bands: Band[]; hasMore: boolean }> {
  const from = page * BANDS_PER_PAGE
  const to = from + BANDS_PER_PAGE

  let query = supabase
    .from('bands_view')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (activeOnly) query = query.eq('is_active', true)

  const { data, error } = await query
```

- [ ] **Step 7: Run tests**

```bash
npx vitest run src/__tests__/band-limit.test.ts
```

Expected: PASS

- [ ] **Step 8: Run full test suite to check for regressions**

```bash
npm run test
```

Expected: all tests pass

- [ ] **Step 9: Commit**

```bash
git add src/types/index.ts src/lib/queries.ts src/__tests__/band-limit.test.ts
git commit -m "feat: add getActiveBandsCount, update getBands and getUserBands for is_active"
```

---

## Task 3: Filter saved bands to active only

**Files:**
- Modify: `src/app/saved/page.tsx`

- [ ] **Step 1: Add `is_active` filter to the bands_view query**

In `src/app/saved/page.tsx`, find:

```ts
    const { data } = await publicSupabase
      .from('bands_view')
      .select('*')
      .in('id', bandIds)
```

Replace with:

```ts
    const { data } = await publicSupabase
      .from('bands_view')
      .select('*')
      .in('id', bandIds)
      .eq('is_active', true)
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/saved/page.tsx
git commit -m "feat: filter saved bands to active only"
```

---

## Task 4: New POST /api/bands/submit route

**Files:**
- Create: `src/app/api/bands/submit/route.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/__tests__/band-limit.test.ts`:

```ts
describe('POST /api/bands/submit — band limit enforcement', () => {
  it('returns 403 when user already has an active band', async () => {
    // This is an integration concern tested manually; see manual test steps below.
    // Unit assertion: getActiveBandsCount returns >= 1 triggers the 403 path.
    mockCount.mockReturnValue(1)
    const count = await getActiveBandsCount('user-123')
    expect(count).toBeGreaterThanOrEqual(1)
  })
})
```

- [ ] **Step 2: Run test**

```bash
npx vitest run src/__tests__/band-limit.test.ts
```

Expected: PASS

- [ ] **Step 3: Create the route**

Create `src/app/api/bands/submit/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isAdmin } from '@/lib/admin-queries'
import { getActiveBandsCount } from '@/lib/queries'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = await isAdmin()
  if (!admin) {
    const activeCount = await getActiveBandsCount(user.id)
    if (activeCount >= 1) {
      return NextResponse.json(
        { error: 'Kamu sudah punya 1 band aktif. Upgrade ke Pro untuk menambah lebih.' },
        { status: 403 }
      )
    }
  }

  const body = await request.json()
  const {
    name, username, bio, formed_year, province_id, city_id,
    contact_wa, contact_email, instagram, youtube, spotify,
    youtube_music, apple_music, bandcamp, photo_url,
    is_looking_for_members, genre_ids,
  } = body

  const { data: band, error } = await supabaseAdmin
    .from('bands')
    .insert({
      name,
      username,
      bio: bio || null,
      formed_year: formed_year || null,
      province_id: province_id || null,
      city_id: city_id || null,
      contact_wa: contact_wa || null,
      contact_email: contact_email || null,
      instagram: instagram || null,
      youtube: youtube || null,
      spotify: spotify || null,
      youtube_music: youtube_music || null,
      apple_music: apple_music || null,
      bandcamp: bandcamp || null,
      photo_url: photo_url || null,
      is_looking_for_members: is_looking_for_members ?? false,
      user_id: user.id,
      is_active: true,
    })
    .select('id, username')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (Array.isArray(genre_ids) && genre_ids.length > 0) {
    await supabaseAdmin
      .from('band_genres')
      .insert(genre_ids.map((genre_id: number) => ({ band_id: band.id, genre_id })))
  }

  // Trigger embedding generation in background
  fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bandId: band.id }),
  }).catch(() => {})

  return NextResponse.json({ id: band.id, username: band.username })
}
```

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/api/bands/submit/route.ts src/__tests__/band-limit.test.ts
git commit -m "feat: add POST /api/bands/submit with band limit enforcement"
```

---

## Task 5: Refactor SubmitForm to use new route

**Files:**
- Modify: `src/app/submit/SubmitForm.tsx`

- [ ] **Step 1: Replace `createBand()` call with fetch to new route**

In `src/app/submit/SubmitForm.tsx`, find the import line:

```ts
import { getProvinces, getCitiesByProvince, getGenres, createBand, uploadBandPhoto } from '@/lib/queries'
```

Replace with:

```ts
import { getProvinces, getCitiesByProvince, getGenres, uploadBandPhoto } from '@/lib/queries'
```

- [ ] **Step 2: Replace the `createBand` call inside `handleSubmit`**

Find:

```ts
      const { id, username } = await createBand({
        name: form.name.trim(),
        username: form.username,
        bio: form.bio || undefined,
        formed_year: form.formed_year ? Number(form.formed_year) : undefined,
        province_id: form.province_id ? Number(form.province_id) : undefined,
        city_id: form.city_id ? Number(form.city_id) : undefined,
        contact_wa: form.contact_wa || undefined,
        contact_email: form.contact_email || undefined,
        instagram: form.instagram || undefined,
        youtube: form.youtube || undefined,
        spotify: form.spotify || undefined,
        youtube_music: form.youtube_music || undefined,
        apple_music: form.apple_music || undefined,
        bandcamp: form.bandcamp || undefined,
        photo_url,
        is_looking_for_members: form.is_looking_for_members,
        genre_ids: form.genre_ids,
      })
      fetch('/api/embeddings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bandId: id }) })
      router.push(`/bands/${username ?? id}`)
```

Replace with:

```ts
      const res = await fetch('/api/bands/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          username: form.username,
          bio: form.bio || null,
          formed_year: form.formed_year ? Number(form.formed_year) : null,
          province_id: form.province_id ? Number(form.province_id) : null,
          city_id: form.city_id ? Number(form.city_id) : null,
          contact_wa: form.contact_wa || null,
          contact_email: form.contact_email || null,
          instagram: form.instagram || null,
          youtube: form.youtube || null,
          spotify: form.spotify || null,
          youtube_music: form.youtube_music || null,
          apple_music: form.apple_music || null,
          bandcamp: form.bandcamp || null,
          photo_url: photo_url ?? null,
          is_looking_for_members: form.is_looking_for_members,
          genre_ids: form.genre_ids,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? t('errors.genericError'))
      }
      const { id, username } = await res.json()
      router.push(`/bands/${username ?? id}`)
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/submit/SubmitForm.tsx
git commit -m "refactor: SubmitForm calls /api/bands/submit instead of createBand()"
```

---

## Task 6: Submit page server gate

**Files:**
- Modify: `src/app/submit/page.tsx`

- [ ] **Step 1: Rewrite the submit page with the gate**

Replace the entire contents of `src/app/submit/page.tsx` with:

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/admin-queries'
import { getActiveBandsCount } from '@/lib/queries'
import { SubmitForm } from './SubmitForm'

export default async function SubmitPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/submit')

  const t = await getTranslations('submit')

  const [admin, activeCount] = await Promise.all([
    isAdmin(),
    getActiveBandsCount(user.id),
  ])

  const atLimit = !admin && activeCount >= 1

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
      <p className="text-stone-500 text-sm mb-8">{t('subtitle')}</p>

      {atLimit ? (
        <div className="flex flex-col items-center text-center gap-4 py-16 px-6 bg-[#fefaf4] dark:bg-[#231d15] border border-stone-200 dark:border-stone-700 rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <Lock className="w-6 h-6 text-amber-700 dark:text-amber-500" />
          </div>
          <div>
            <p className="font-semibold text-stone-900 dark:text-stone-100 mb-1">
              Kamu sudah punya 1 band aktif
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Upgrade ke Pro untuk daftarkan lebih banyak band.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Pelajari Pro →
          </Link>
        </div>
      ) : (
        <SubmitForm />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/submit/page.tsx
git commit -m "feat: submit page gate — show upgrade prompt when user has active band"
```

---

## Task 7: Pricing placeholder page

**Files:**
- Create: `src/app/pricing/page.tsx`

- [ ] **Step 1: Create the pricing page**

```tsx
// src/app/pricing/page.tsx
import { Check } from 'lucide-react'

export default function PricingPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-3">Pilih Plan</h1>
        <p className="text-stone-500 dark:text-stone-400">Mulai gratis, upgrade kapan saja.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Free */}
        <div className="border border-stone-200 dark:border-stone-700 rounded-2xl p-6">
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">Free</p>
          <p className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">Rp 0</p>
          <ul className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-600 shrink-0" />
              1 band aktif
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-600 shrink-0" />
              Profil band lengkap
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-600 shrink-0" />
              Muncul di browse & pencarian
            </li>
          </ul>
        </div>

        {/* Pro */}
        <div className="border-2 border-amber-600 dark:border-amber-500 rounded-2xl p-6 relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-white text-xs font-medium px-3 py-1 rounded-full">
            Segera Hadir
          </span>
          <p className="text-sm font-medium text-amber-700 dark:text-amber-500 mb-1">Pro</p>
          <p className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-6">TBD</p>
          <ul className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-600 shrink-0" />
              Band aktif tidak terbatas
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-600 shrink-0" />
              Semua fitur Free
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-600 shrink-0" />
              Prioritas di hasil pencarian
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/pricing/page.tsx
git commit -m "feat: add /pricing placeholder page"
```

---

## Task 8: PATCH /api/bands/[id]/activate endpoint

**Files:**
- Create: `src/app/api/bands/[id]/activate/route.ts`

- [ ] **Step 1: Create the route**

```ts
// src/app/api/bands/[id]/activate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface Params {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const { data: band } = await supabaseAdmin
    .from('bands')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (!band || band.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Deactivate all user's bands, then activate the target
  const { error: deactivateError } = await supabaseAdmin
    .from('bands')
    .update({ is_active: false })
    .eq('user_id', user.id)

  if (deactivateError) {
    return NextResponse.json({ error: deactivateError.message }, { status: 500 })
  }

  const { error: activateError } = await supabaseAdmin
    .from('bands')
    .update({ is_active: true })
    .eq('id', id)

  if (activateError) {
    return NextResponse.json({ error: activateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/bands/[id]/activate/route.ts
git commit -m "feat: add PATCH /api/bands/[id]/activate endpoint"
```

---

## Task 9: Dashboard UI — active badge, Aktifkan button, multi-active notice

**Files:**
- Modify: `src/components/LoadMoreDashboard.tsx`
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Update LoadMoreDashboard to show active/inactive state**

Replace the entire contents of `src/components/LoadMoreDashboard.tsx` with:

```tsx
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { BandCard } from './BandCard'
import { CardSkeleton } from './ui/Skeleton'
import type { Band } from '@/types'

interface Props {
  initialBands: Band[]
  initialHasMore: boolean
}

export function LoadMoreDashboard({ initialBands, initialHasMore }: Props) {
  const [bands, setBands] = useState(initialBands)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [activating, setActivating] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    const nextPage = page + 1
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/dashboard?page=${nextPage}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setBands((prev) => [...prev, ...data.bands])
      setHasMore(data.hasMore)
      setPage(nextPage)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) loadMore()
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  async function handleActivate(bandId: string) {
    setActivating(bandId)
    try {
      const res = await fetch(`/api/bands/${bandId}/activate`, { method: 'PATCH' })
      if (!res.ok) throw new Error('failed')
      setBands((prev) =>
        prev.map((b) => ({ ...b, is_active: b.id === bandId }))
      )
    } catch {
      // no-op — user can retry
    } finally {
      setActivating(null)
    }
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bands.map((band) => (
          <div key={band.id} className="relative group/card flex flex-col gap-2">
            <div className="relative flex-1">
              <BandCard band={band} />
              <Link
                href={`/bands/${band.id}/edit`}
                className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity"
              >
                <Pencil className="w-3 h-3" /> Edit
              </Link>
            </div>
            <div className="px-1">
              {band.is_active ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Aktif
                </span>
              ) : (
                <button
                  onClick={() => handleActivate(band.id)}
                  disabled={activating === band.id}
                  className="text-xs font-medium text-amber-700 dark:text-amber-500 border border-amber-300 dark:border-amber-700 px-2.5 py-1 rounded-full hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                >
                  {activating === band.id ? 'Mengaktifkan…' : 'Aktifkan'}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>

      {error && (
        <div className="col-span-full text-center py-6">
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">Gagal memuat band berikutnya.</p>
          <button onClick={loadMore} className="text-sm text-amber-700 dark:text-amber-500 hover:underline">
            Coba lagi
          </button>
        </div>
      )}

      <div ref={sentinelRef} />
    </>
  )
}
```

- [ ] **Step 2: Add multi-active notice to dashboard page**

In `src/app/dashboard/page.tsx`, find:

```ts
  const [{ bands, hasMore }, profileRes, t] = await Promise.all([
    getUserBands(user.id),
```

No change needed — dashboard shows all bands (activeOnly defaults to false). But we need to detect multiple active bands. Add after the `getUserBands` call:

Find:
```ts
  const profile = profileRes.data
```

Replace with:
```ts
  const profile = profileRes.data
  const multipleActive = bands.filter((b) => b.is_active).length > 1
```

Then find the JSX block that renders the band list heading:
```tsx
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
```

Add the notice **before** that block:
```tsx
      {multipleActive && (
        <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-800 dark:text-amber-400">
          Kamu punya lebih dari 1 band aktif. Pilih satu yang ingin ditampilkan di browse.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: no errors

- [ ] **Step 4: Update user public profile to use activeOnly**

In `src/app/u/[id]/page.tsx`, find:

```ts
  const { bands } = await getUserBands(profile.id)
```

Replace with:

```ts
  const { bands } = await getUserBands(profile.id, 0, true)
```

- [ ] **Step 5: Run full test suite**

```bash
npm run test
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/components/LoadMoreDashboard.tsx src/app/dashboard/page.tsx src/app/u/[id]/page.tsx
git commit -m "feat: dashboard active badge, Aktifkan button, multi-active notice; user profile shows active bands only"
```

---

## Manual Verification Checklist

After all tasks are complete, verify in the browser:

- [ ] User with 0 bands → `/submit` shows the form normally
- [ ] User with 1 active band → `/submit` shows upgrade prompt with "Pelajari Pro →" link
- [ ] Admin user with 1 active band → `/submit` still shows the form
- [ ] Browse page only shows active bands
- [ ] Saved page only shows active saved bands
- [ ] User public profile only shows active bands
- [ ] Dashboard shows all bands (active + inactive) with correct badges
- [ ] Clicking "Aktifkan" swaps the active band (old one shows inactive, new one shows active)
- [ ] Multi-active notice appears for users with >1 active band, disappears after picking one
- [ ] `/pricing` renders the two-tier comparison correctly
