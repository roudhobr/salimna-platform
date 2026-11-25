# Dokumentasi Salimna Platform

## 1. Deskripsi

Salimna adalah platform media dan komunitas yang membahas fenomena sosial, lingkungan hidup, dan praktik keagamaan dengan pendekatan yang jernih dan bijak. Situs ini juga menyediakan katalog dan pemesanan koleksi busana Salimna Cloth.

Platform menggabungkan publikasi artikel, pengelolaan toko daring, pemrosesan pesanan, portal nota, serta panel administrasi dalam satu aplikasi.

## 2. Tech stack

| Bagian | Teknologi |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6 |
| Tampilan dan animasi | Tailwind CSS 4, Motion, Lucide React |
| Navigasi | React Router 7 |
| Backend API | Node.js, Express 5, TypeScript melalui `tsx` |
| Database | Supabase PostgreSQL |
| Autentikasi admin | Supabase Auth |
| Penyimpanan gambar hero | Supabase Storage, bucket `salimna-media` |
| Konfirmasi WhatsApp | Tautan chat WhatsApp `wa.me` yang dibuka oleh pengunjung/admin |
| Hosting produksi | Griv Cloud cPanel Node.js |

Frontend mengakses API melalui prefix `/api`. Saat pengembangan, Vite berjalan pada port `3000` dan meneruskan permintaan API ke backend Express pada port `5000`.

## 3. Fitur situs

### Halaman publik

- **Beranda** menampilkan tiga slide hero, pengantar Salimna, ringkasan tulisan, dan koleksi toko. Slide hero dapat memakai foto yang diunggah admin atau gambar bawaan.
- **Artikel** menampilkan tulisan riset dengan kategori dan pencarian berdasarkan judul, kategori, deskripsi, isi, serta penulis. Artikel dapat dibuka untuk membaca isi lengkap.
- **Toko** menampilkan katalog produk, filter kategori, informasi harga/stok, dan pilihan produk.
- **Keranjang dan checkout** mengumpulkan nama, nomor WhatsApp, alamat, email opsional, serta item pesanan. Pesanan dibuat melalui API dan stok diproses lewat fungsi database.
- **Konfirmasi WhatsApp** tersedia sebagai tautan chat setelah checkout. Pengunjung meninjau dan mengirim pesan dari aplikasi WhatsApp; server tidak mengirim pesan otomatis.
- **Portal nota** menyediakan tautan nota untuk pesanan. Nota dapat dibuka dan dicetak atau disimpan sebagai PDF; data publiknya dibatasi pada nomor pesanan, tanggal, status, rincian item, dan total.
- **Pemuatan data cepat** menggunakan cache memori dan `localStorage` untuk menampilkan data yang pernah dimuat sambil mengambil pembaruan dari server.
- Tampilan responsif untuk layar ponsel dan desktop.

### Panel admin (`/admin`)

- Login menggunakan Supabase Auth. Email harus terkonfirmasi dan tercantum di `ADMIN_EMAILS`.
- **Ringkasan** statistik katalog, artikel, pesanan, omzet, serta pesanan terbaru.
- **Katalog produk** untuk menambah, mengubah, dan menghapus produk serta mengelola harga, kategori, stok, dan gambar.
- **Artikel riset** untuk membuat, mengubah, menerbitkan, dan menghapus artikel.
- **Pesanan** untuk melihat detail pelanggan, menyaring status, memperbarui status, dan mengelola pesanan.
- **WhatsApp status pesanan** menyediakan tombol untuk membuka chat dengan template sesuai status. Admin tetap menekan tombol kirim di WhatsApp.
- **Kumpulan Nota** menampilkan tautan portal nota untuk pesanan.
- **Tampilan Hero** untuk mengganti hingga tiga foto latar. Foto diunggah server ke Supabase Storage setelah autentikasi admin.
- Ekspor pesanan ke CSV dan pengelolaan pesanan lama.
- Inbox/panel pesan pengunjung tidak disediakan di admin.

## 4. Alur penggunaan

### Pengunjung membaca artikel

1. Pengunjung membuka halaman Beranda atau Artikel.
2. Pada halaman Artikel, pengunjung memilih kategori atau mengetik kata kunci.
3. Hasil pencarian difilter langsung di browser; pengunjung memilih kartu artikel untuk membaca isinya.

### Pengunjung memesan produk

1. Pengunjung membuka katalog Toko, memilih produk, lalu menambahkannya ke keranjang.
2. Pengunjung mengisi data checkout dan mengirim pesanan.
3. Backend memvalidasi data dan meminta Supabase membuat pesanan serta memproses stok melalui RPC database.
4. Jika `ORDER_RECEIPT_SECRET` sudah dikonfigurasi, backend membuat token untuk tautan nota.
5. Setelah pesanan berhasil, pengunjung melihat nomor pesanan dan dapat membuka nota atau mengonfirmasi pesanan melalui WhatsApp.
6. Setelah pesanan berhasil, pengunjung melihat nomor pesanan dan dapat membuka nota atau tautan chat WhatsApp. Pesan dikirim oleh pengguna dari WhatsApp, bukan otomatis oleh server.

### Admin mengelola pesanan

1. Admin masuk menggunakan akun Supabase Auth yang emailnya terkonfirmasi dan masuk daftar `ADMIN_EMAILS`.
2. Admin membuka pesanan, memeriksa rincian, lalu mengubah statusnya.
3. Admin dapat membuka chat WhatsApp dengan template sesuai status dan mengirimkannya sendiri.
4. Admin maupun pelanggan dapat membuka nota melalui tautan bertoken. Endpoint nota tidak mengembalikan nomor telepon atau alamat pelanggan.

### Admin mengganti gambar hero

1. Admin memilih foto untuk salah satu dari tiga slide di panel Tampilan Hero.
2. Browser mengirim gambar ke backend dengan sesi admin.
3. Backend memeriksa format dan ukuran, mengunggah file ke bucket `salimna-media`, lalu menyimpan URL-nya di tabel `site_settings`.
4. Situs mengambil pengaturan terbaru dan menampilkan gambar baru.

## 5. Komponen teknis dan struktur proyek

- `src/components/` — komponen antarmuka seperti navigasi, hero, toko, keranjang, dan footer.
- `src/pages/` — halaman Artikel, Toko, Admin, dan Nota.
- `src/services/api.ts` — pemanggilan endpoint backend dan cache data frontend.
- `src/context/CartContext.tsx` — state keranjang belanja.
- `server/index.ts` — konfigurasi server Express dan pemasangan router API.
- `server/routes/` — endpoint produk, artikel, pesanan, nota, statistik, pengaturan situs, dan inquiry.
- `server/admin.ts` — autentikasi serta endpoint administrasi.
- `server/services/` — layanan WhatsApp dan token portal nota.
- `supabase/schema.sql` — tabel, kebijakan akses, fungsi transaksi pesanan/stok, dan data awal.
- `supabase/site-settings.sql` — tabel pengaturan situs dan bucket Storage untuk foto hero.

## 6. Konfigurasi dan menjalankan aplikasi

### Variabel lingkungan

Salin `.env.example` menjadi `.env`, lalu isi kredensial sesuai project. Nama variabel yang digunakan:

- `PORT`, `NODE_ENV`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `ADMIN_EMAILS`
- `ORDER_RECEIPT_SECRET`
- `VITE_API_URL`

`SUPABASE_SERVICE_ROLE_KEY` dan `ORDER_RECEIPT_SECRET` adalah rahasia server. Jangan beri awalan `VITE_` dan jangan kirim nilainya ke browser atau commit ke Git. Token nota memerlukan secret acak minimal 32 byte; menggantinya akan membatalkan tautan nota yang sebelumnya dibuat.

### Persiapan Supabase

1. Jalankan `supabase/schema.sql` melalui SQL Editor Supabase.
2. Jalankan `supabase/site-settings.sql` untuk fitur unggah hero.
3. Buat akun admin melalui Supabase Auth dan masukkan email terkonfirmasinya ke `ADMIN_EMAILS`.
4. Isi variabel lingkungan yang diperlukan di lingkungan server.

### Perintah proyek

```bash
npm install
npm run dev       # Backend dan frontend untuk pengembangan
npm run lint      # Pemeriksaan TypeScript
npm run build     # Build frontend ke folder dist
```

`npm run server` menjalankan backend saja, `npm run client` menjalankan frontend Vite saja, dan `npm run seed` menjalankan seeding data.

## 7. Hosting di Griv Cloud (cPanel Node.js)

Backend Express dapat menyajikan frontend hasil build pada origin yang sama. Ini membuat halaman publik, rute React, dan API `/api/*` berjalan dalam satu aplikasi Node.js tanpa konfigurasi proxy lintas-origin.

### Persiapan aplikasi

1. Pastikan paket Griv Cloud menyediakan **Setup Node.js App** atau fitur Node.js berbasis Passenger, dan pilih Node.js 20 atau lebih baru.
2. Unggah/clone repository ke application root cPanel, termasuk `app.js`, `package.json`, dan `package-lock.json`; jangan unggah `node_modules`.
3. Buat aplikasi Node.js di cPanel. Gunakan domain/subdomain yang akan menjadi URL situs, application root repository, mode `production`, dan startup file `app.js`.
4. Instal dependensi di application root:

   ```bash
   npm install
   ```

5. Atur environment variables di panel cPanel. Gunakan `NODE_ENV=production` dan `SERVE_CLIENT=true`, lalu isi variabel Supabase, `ADMIN_EMAILS`, dan `ORDER_RECEIPT_SECRET`. Biarkan cPanel mengatur `PORT`; jangan memaksa port lokal `5000`.
6. Sediakan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` saat menjalankan build frontend karena variabel berawalan `VITE_` disematkan ke bundle browser.
7. Build frontend:

   ```bash
   npm run build
   ```

   Pastikan folder `dist` dibuat sebelum aplikasi dimulai. Startup akan memberi error jika `SERVE_CLIENT=true` tetapi file `dist/index.html` belum ada.
8. Jalankan atau restart aplikasi dari panel cPanel. Setelah aktif, cek `https://domain-anda/api/health`; halaman utama dan rute seperti `/artikel`, `/shop`, dan `/nota/:token` juga dilayani oleh aplikasi yang sama.

`app.js` adalah startup file cPanel. File tersebut mengaktifkan runtime `tsx` agar Passenger dapat menjalankan backend TypeScript. `server/index.ts` menyajikan folder `dist` dan mengarahkan rute frontend kembali ke `index.html` hanya ketika `SERVE_CLIENT=true`; mode pengembangan lokal tetap memakai Vite di port `3000`.

Kredensial Supabase service role dan secret nota harus disetel sebagai environment variables server-side di cPanel, bukan di variabel `VITE_*`. Jika fitur Node.js tidak terlihat di cPanel, hubungi Griv Cloud karena ketersediaan Node.js ditentukan oleh paket/konfigurasi penyedia hosting.
