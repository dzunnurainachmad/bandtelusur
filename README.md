# BandTelusur

Direktori band dan project musik Indonesia. Temukan band dari seluruh nusantara, dengarkan musik mereka langsung di platform, dan daftarkan band kamu.

## Fitur

- **Jelajahi Band** — filter berdasarkan provinsi, kota, dan genre musik
- **AI Chat** — tanya AI untuk rekomendasi band sesuai selera musikmu lewat chat interaktif (floating mini chat + halaman penuh)
- **Semantic Search** — cari band dengan bahasa alami menggunakan vector embeddings
- **AI Bio Generator** — buat bio band secara otomatis dengan AI, cukup isi detail band
- **Band Insights** — analisis AI untuk profil band: kekuatan, saran, dan pitch booking
- **Halaman Band** — profil lengkap dengan embed YouTube, Spotify, Apple Music, dan link Bandcamp
- **Band Serupa** — rekomendasi band serupa berdasarkan semantic similarity
- **Mini Player** — putar musik langsung dari browser dengan floating player, mendukung beberapa sumber sekaligus
- **Upload Foto** — editor crop foto dengan drag & zoom sebelum upload
- **Simpan Band** — bookmark band favorit, tersimpan di halaman Saved
- **Autentikasi** — login via email atau Google OAuth, lengkap dengan forgot password
- **Profil Pengguna** — username, display name, bio, dan halaman profil publik
- **Dashboard** — kelola band milikmu (buat, edit, hapus)
- **Admin Panel** — moderasi konten, ban/unban user, AI metrics
- **Internasionalisasi** — UI tersedia dalam Bahasa Indonesia dan English (next-intl)
- **Dark / Light Mode** — toggle tema sesuai preferensi

## Tech Stack

- [Next.js 16](https://nextjs.org) — App Router, React 19
- [Supabase](https://supabase.com) — database, auth, storage, vector embeddings (pgvector)
- [Vercel AI SDK](https://sdk.vercel.ai) — AI chat streaming, tool calls
- [OpenAI GPT-4o-mini](https://openai.com) — AI chat, bio generator, band insights, embeddings
- [Upstash Redis](https://upstash.com) — rate limiting
- [Tailwind CSS v4](https://tailwindcss.com)
- [next-intl](https://next-intl-docs.vercel.app) — i18n (id / en)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [lucide-react](https://lucide.dev)
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) — unit tests

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Buat file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

### 3. Database migration

Jalankan file berikut di Supabase SQL Editor secara berurutan:

```
supabase/migrations/001_schema.sql
supabase/migrations/002_seed.sql
supabase/migrations/003_storage.sql
supabase/migrations/004_admin.sql
supabase/migrations/005_embeddings.sql
supabase/migrations/006_filter_bands_by_genre.sql
supabase/migrations/007_ai_logs.sql
supabase/migrations/008_ai_feedback.sql
supabase/migrations/009_agent_tables.sql
supabase/migrations/010_profiles_extended.sql
supabase/migrations/011_profiles_username.sql
supabase/migrations/012_saved_bands.sql
supabase/migrations/013_count_bands_by_genre.sql
supabase/migrations/014_posts.sql
```

### 4. Set admin pertama

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 5. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run lint       # ESLint
npm run test       # run unit tests (vitest)
npm run test:watch # vitest watch mode
npm run eval       # run AI eval tests (requires OPENAI_API_KEY)
```
