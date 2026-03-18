# BandTelusur

Direktori band dan project musik Indonesia. Temukan band dari seluruh nusantara, dengarkan musik mereka langsung di platform, dan daftarkan band kamu.

## Fitur

- **Jelajahi Band** — filter berdasarkan provinsi, kota, dan genre musik dengan loading indicator
- **Discover AI** — tanya AI untuk rekomendasi band sesuai selera musikmu lewat chat interaktif
- **Semantic Search** — cari band dengan bahasa alami menggunakan vector embeddings
- **AI Bio Generator** — buat bio band secara otomatis dengan AI, cukup isi detail band
- **Halaman Band** — profil lengkap dengan embed YouTube, Spotify, Apple Music, dan link Bandcamp
- **Band Serupa** — rekomendasi band serupa berdasarkan semantic similarity
- **Mini Player** — putar musik langsung dari browser dengan floating player, mendukung beberapa sumber sekaligus
- **Upload Foto** — editor crop foto dengan drag & zoom sebelum upload
- **Autentikasi** — login via email atau Google OAuth, lengkap dengan forgot password
- **Dashboard** — kelola band milikmu (buat, edit, hapus)
- **Admin Panel** — ban/unban user, hapus band yang melanggar ketentuan
- **Dark / Light Mode** — toggle tema sesuai preferensi

## Tech Stack

- [Next.js 16](https://nextjs.org) — App Router
- [Supabase](https://supabase.com) — database, auth, storage, vector embeddings
- [OpenAI GPT-4o-mini](https://openai.com) — AI chat, bio generator, embeddings
- [Tailwind CSS v4](https://tailwindcss.com)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [lucide-react](https://lucide.dev)

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
```

### 3. Database migration

Jalankan file berikut di Supabase SQL Editor secara berurutan:

```
supabase/migrations/001_schema.sql
supabase/migrations/002_seed.sql
supabase/migrations/003_storage.sql
supabase/migrations/004_rls.sql
supabase/migrations/005_admin.sql
supabase/migrations/006_embeddings.sql
supabase/migrations/007_filter_bands_by_genre.sql
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
