# Salimna Platform

Salimna adalah platform eksplorasi fenomena sosial, alam, dan keagamaan, serta katalog resmi koleksi busana eksklusif **Salimna Cloth**.

## Arsitektur Aplikasi

Platform ini dibangun dengan arsitektur **Full Stack**:
- **Frontend**: React 19, Vite, Tailwind CSS v4, Motion, Lucide Icons, React Router v7.
- **Backend**: Node.js, Express.js.
- **Database**: **Supabase** (Cloud PostgreSQL) dengan Row Level Security (RLS) & REST API via `@supabase/supabase-js`.

---

## Konfigurasi Supabase

### 1. Eksekusi Skema SQL di Supabase
1. Buka dashboard Supabase Anda di [supabase.com/dashboard](https://supabase.com/dashboard).
2. Buat atau buka Project Anda.
3. Buka menu **SQL Editor** pada navigasi sebelah kiri.
4. Salin seluruh isi file [`supabase/schema.sql`](supabase/schema.sql), tempelkan ke SQL Editor, lalu klik tombol **Run**.
5. Skema tabel (`products`, `articles`, `orders`, `inquiries`), RLS policies, index, dan initial seed data akan dibuat secara otomatis.

### 2. Atur Variabel Lingkungan (.env)
Buat atau edit file `.env` di root direktori project:
```env
# Backend Port
PORT=5000
NODE_ENV=development

# Kredensial Supabase (dari Project Settings -> API)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-optional

# Frontend Vite
VITE_API_URL=/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Cara Menjalankan

### Prasyarat
- Node.js (v20+ disarankan)
- npm

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Seeding Data (Opsional)
Jika Anda belum menjalankan seed melalui `supabase/schema.sql`, Anda dapat menjalankan script seed TypeScript:
```bash
npm run seed
```

### 3. Jalankan Aplikasi (Full Stack)
```bash
npm run dev
```

Aplikasi frontend akan berjalan di `http://localhost:3000` dan backend server di `http://localhost:5000`.

### 4. Skrip Lainnya
- `npm run server`: Menjalankan server backend mandiri
- `npm run client`: Menjalankan frontend Vite mandiri
- `npm run seed`: Mengisi data awal katalog produk dan artikel ke Supabase
- `npm run lint`: Memvalidasi tipe TypeScript (`tsc --noEmit`)
- `npm run build`: Membangun bundle produksi frontend
