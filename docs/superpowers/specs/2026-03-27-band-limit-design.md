# Band Limit & Upgrade Prompt — Design Spec

**Date:** 2026-03-27
**Status:** Approved

## Summary

Free users are limited to 1 active band in the browse directory. Attempting to submit a second band shows an upgrade prompt. Admins (`profiles.role = 'admin'`) are exempt. No payment is implemented yet — this sets up the freemium narrative for a future Pro tier.

---

## 1. Database

### Migration (`015_band_active.sql`)

```sql
ALTER TABLE bands ADD COLUMN is_active boolean NOT NULL DEFAULT true;
```

- All existing bands default to `true` — no data loss.
- `bands_view` is updated to expose `is_active`.
- Browse query adds `.eq('is_active', true)` filter.

---

## 2. Enforcement

### Architecture note

Band creation currently runs client-side via `createBand()` in `src/lib/queries.ts` (uses `supabaseBrowser`). There is no `POST /api/bands` submission route. The primary enforcement point is therefore the **submit page server component**, which checks the active band count before deciding what to render.

A secondary server-side check is added via a new **`POST /api/bands/submit`** route. `SubmitForm` is refactored to call this route instead of `createBand()` directly. The route re-checks the limit before inserting, preventing UI bypass.

### Submit page (`/submit/page.tsx`) — primary gate

Server component checks the authenticated user's active band count:

- **Not logged in** → redirect to `/login`
- **`count = 0`** → render `<SubmitForm />`
- **`count >= 1` and not admin** → render upgrade prompt:

```
Kamu sudah punya 1 band aktif.
Upgrade ke Pro untuk daftarkan lebih banyak band.

[Pelajari Pro →]  ← links to /pricing (placeholder)
```

### API (`POST /api/bands/submit`) — secondary gate

Re-checks active band count before insert:

- If user has `>= 1` active band → return `403`:
  ```json
  { "error": "Kamu sudah punya 1 band aktif. Upgrade ke Pro untuk menambah lebih." }
  ```
- Admins exempt (`isAdmin()` from `src/lib/admin-queries.ts`).
- On success: handles insert + genre linking + triggers embedding generation.
- `SubmitForm` is updated to call this route instead of `createBand()`.

---

## 3. Dashboard — Choose Active Band

Location: `/dashboard`

### Per-band UI changes

| State    | UI                          |
|----------|-----------------------------|
| Active   | "Aktif" badge (green)       |
| Inactive | "Aktifkan" button           |

### Activate endpoint

`PATCH /api/bands/[id]/activate`

1. Verifies the band belongs to the requesting user.
2. Sets target band `is_active = true`.
3. Sets all other bands for that user `is_active = false`.
4. Result: exactly 1 active band per user at all times.

### Existing users with multiple active bands

Dashboard shows a yellow notice until user is down to 1 active band:

```
Kamu punya lebih dari 1 band aktif.
Pilih satu yang ingin ditampilkan di browse.
```

---

## 4. Pricing placeholder

`/pricing/page.tsx` — static server component. Displays:
- Free tier: 1 band
- Pro tier: unlimited bands (price TBD)
- "Segera hadir" / coming soon messaging

---

## 5. Files to Create / Modify

| File | Change |
|------|--------|
| `supabase/migrations/015_band_active.sql` | Add `is_active` column, update `bands_view` |
| `src/lib/queries.ts` | Add `getActiveBandsCount(userId)` helper; update browse filter |
| `src/app/submit/page.tsx` | Check active count server-side; render upgrade prompt or form |
| `src/app/api/bands/submit/route.ts` | New POST — enforces limit, handles insert + genres + embedding |
| `src/app/submit/SubmitForm.tsx` | Call `/api/bands/submit` instead of `createBand()` |
| `src/app/api/bands/[id]/activate/route.ts` | New PATCH — swap active band |
| `src/app/dashboard/page.tsx` | Active badge, Aktifkan button, multi-active notice |
| `src/app/pricing/page.tsx` | New placeholder page |

---

## 6. Out of Scope

- Actual payment / Pro tier implementation
- Admin UI to manually grant Pro access
- Limit on number of inactive bands (kept, just hidden from browse)
