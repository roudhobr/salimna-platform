# Salimna Platform

Salimna adalah platform eksplorasi fenomena sosial, alam, dan keagamaan, serta katalog resmi koleksi busana eksklusif **Salimna Cloth**.

Lihat [dokumentasi platform](./DOKUMENTASI_PLATFORM.md) untuk penjelasan tech stack, fitur, alur penggunaan, dan hosting.

## Arsitektur Aplikasi

Platform ini dibangun dengan arsitektur **Full Stack**:
- **Frontend**: React 19, Vite, Tailwind CSS v4, Motion, Lucide Icons, React Router v7.
- **Backend**: Node.js, Express.js.
- **Database**: **Supabase** (Cloud PostgreSQL) dengan Row Level Security (RLS) dan transaksi checkout melalui RPC.
- **Admin panel**: mengelola produk, stok, artikel, pesanan, nota, dan gambar hero melalui `/admin`. Inbox pesan pengunjung tidak tersedia di panel.

React membaca katalog, artikel terbit, dan pengaturan hero publik langsung dari Supabase menggunakan anon key dan RLS. Formulir kontak juga mengirim langsung ke Supabase. Checkout, operasi admin, unggahan gambar hero, dan portal nota tetap memakai backend karena memerlukan validasi/izin server-side dan rahasia server.

---

## Konfigurasi Supabase

### 1. Eksekusi Skema SQL di Supabase
1. Buka dashboard Supabase Anda di [supabase.com/dashboard](https://supabase.com/dashboard).
2. Buat atau buka Project Anda.
3. Buka menu **SQL Editor** pada navigasi sebelah kiri.
4. Salin seluruh isi file [`supabase/schema.sql`](supabase/schema.sql), tempelkan ke SQL Editor, lalu klik tombol **Run**.
5. Skema tabel (`products`, `articles`, `orders`, `inquiries`), RLS policies, fungsi transaksi stok checkout, index, dan initial seed data akan dibuat secara otomatis.
6. Untuk upload latar hero, jalankan juga [`supabase/site-settings.sql`](supabase/site-settings.sql). File ini menyiapkan bucket publik `salimna-media`; unggah dan hapus gambar tetap dibatasi melalui API server yang memverifikasi admin.

### 2. Atur Variabel Lingkungan (.env)
Buat atau edit file `.env` di root direktori project:
```env
# Backend Port
PORT=5000
NODE_ENV=development

# Kredensial Supabase (dari Project Settings -> API)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key

# Secret acak minimal 32 byte untuk menandatangani link portal nota
ORDER_RECEIPT_SECRET=replace-with-at-least-32-random-bytes

# Email akun Supabase Auth yang diizinkan masuk ke admin (pisahkan banyak email dengan koma)
ADMIN_EMAILS=admin@example.com

# Frontend Vite
# Opsional: URL backend Express untuk checkout dan fitur admin (default /api)
VITE_API_URL=/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

`SUPABASE_SERVICE_ROLE_KEY` hanya boleh disimpan sebagai environment variable backend (termasuk Griv Cloud)—jangan pernah memakai awalan `VITE_` atau mengirimkannya ke browser. Admin login menggunakan Supabase Auth (email dan password). Buat akun di **Supabase Dashboard → Authentication → Users → Add user**, pastikan email sudah dikonfirmasi, lalu masukkan email tersebut ke `ADMIN_EMAILS`. Pisahkan beberapa email dengan koma. Server hanya mengizinkan akun terkonfirmasi yang tercantum di daftar itu; jangan gunakan `user_metadata` untuk menentukan hak admin.

Jika frontend di-deploy ke Vercel, tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di **Project Settings → Environment Variables** untuk environment yang digunakan (Production/Preview), lalu buat deployment baru. Vite memasukkan nilai tersebut saat build; mengubah environment variable tidak memperbarui deployment yang sudah ada. Jangan masukkan `SUPABASE_SERVICE_ROLE_KEY` ke variabel berawalan `VITE_`.

Atur `ORDER_RECEIPT_SECRET` dengan nilai acak minimal 32 byte, misalnya hasil `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Link nota adalah akses khusus pemegang link; isinya hanya nomor pesanan, tanggal, item, total, dan status. Mengganti secret akan membatalkan link nota yang lama.

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

Aplikasi frontend akan berjalan di `http://localhost:3000` dan backend server di `http://localhost:5000`. Jalankan ulang SQL schema di Supabase setelah memperbarui aplikasi agar fungsi checkout dan kebijakan RLS terbaru terpasang.

### 4. Skrip Lainnya
- `npm run server`: Menjalankan server backend mandiri
- `npm run client`: Menjalankan frontend Vite mandiri
- `npm run seed`: Mengisi data awal katalog produk dan artikel ke Supabase
- `npm run lint`: Memvalidasi tipe TypeScript (`tsc --noEmit`)
- `npm run build`: Membangun bundle produksi frontend
