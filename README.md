# Salimna Platform

Salimna adalah platform eksplorasi fenomena sosial, alam, dan keagamaan, serta katalog resmi koleksi busana eksklusif **Salimna Cloth**.

## Arsitektur Aplikasi

Platform ini dibangun dengan arsitektur **Full Stack**:
- **Frontend**: React 19, Vite, Tailwind CSS, Motion, Lucide Icons, React Router v7.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite lokal (`server/data/salimna.db`) menggunakan engine `node:sqlite`.

## Cara Menjalankan

### Prasyarat
- Node.js (v20+ disarankan, v24+ didukung penuh)
- npm

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Jalankan Aplikasi (Full Stack)
```bash
npm run dev
```

Aplikasi frontend akan berjalan di `http://localhost:3000` dan backend server di `http://localhost:5000`.

### 3. Skrip Lainnya
- `npm run server`: Menjalankan server backend mandiri
- `npm run client`: Menjalankan frontend Vite mandiri
- `npm run seed`: Mengisi ulang database SQLite dengan data awal
- `npm run build`: Membangun bundle produksi
