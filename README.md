# SIRADA Kencana — Frontend

**Sistem Informasi Rute dan Demand Analitik** — dashboard analitik internal untuk
perusahaan shuttle travel **Kencana Travel**.

Dibangun dengan **React + Vite + TypeScript**, **Tailwind CSS**, **React Router**,
**Axios**, dan **Recharts**. Mengonsumsi backend FastAPI (JWT Bearer auth).

---

## 🚀 Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
```

Perintah lain:

```bash
npm run build      # build produksi ke dist/
npm run preview    # serve hasil build
npm run typecheck  # cek tipe TypeScript (tsc --noEmit)
```

## ⚙️ Konfigurasi

Base URL API diatur lewat variabel environment (mudah diganti saat deploy ke Railway):

```env
# .env
VITE_API_BASE_URL=http://localhost:8000
```

Salin `.env.example` menjadi `.env` bila belum ada.

## 📁 Struktur Folder

```
src/
├── api/            # 1 file per modul endpoint
│   ├── client.ts       # instance axios + interceptor JWT + handler 401
│   ├── auth.ts         # POST /api/auth/login
│   ├── dashboard.ts    # GET /api/dashboard/*
│   ├── transaksi.ts    # GET/POST /api/transaksi
│   ├── segmentasi.ts   # GET /api/segmentasi/*
│   ├── forecasting.ts  # GET rute-tersedia, POST run
│   └── performa.ts     # GET /api/performa-rute[, /vip-vs-reguler]
├── components/     # komponen reusable
│   ├── Button, Badge, Card, Table, Modal, Pagination, ProgressBar
│   ├── Sidebar, Topbar, Layout, PageHeader, KpiCard, Logo
│   ├── Spinner (Skeleton), ErrorState, ProtectedRoute
│   └── TambahTransaksiModal
├── context/        # AuthContext (JWT/role), ToastContext (notifikasi)
├── lib/            # format angka/mata uang, useAsync, useDebounce, warna, storage
├── pages/          # Login, Dashboard, DataTransaksi, Segmentasi, Forecasting, PerformaRute
├── types/          # interface TypeScript per respons endpoint
├── App.tsx         # definisi route
└── main.tsx        # entry (Router + Provider)
```

## 🔐 Autentikasi & Role

- Login (`POST /api/auth/login`) menyimpan `access_token` & `role` di `localStorage`.
- Interceptor axios otomatis menambah header `Authorization: Bearer <token>`.
- Setiap respons **401** → token dihapus & pengguna diarahkan ke `/login` (SPA, tanpa reload).
- **Role-based UI** — hanya `Admin` yang dapat melakukan aksi tulis:
  - Tombol **Tambah Transaksi** & **Import CSV** (Data Transaksi)
  - Tombol **Jalankan Model AI** (Segmentasi & Forecasting)

  Role `Owner` & `KepalaOutlet` bersifat **read-only** (tombol disembunyikan/dikunci).

## 🌐 Endpoint yang Dikonsumsi

| Halaman | Endpoint |
|---|---|
| Login | `POST /api/auth/login` |
| Dashboard | `GET /api/dashboard/summary`, `.../distribusi-member`, `.../aktivitas-terkini` |
| Data Transaksi | `GET /api/transaksi` (query: `cari,rute,layanan,channel,halaman,per_halaman`), `POST /api/transaksi` |
| Segmentasi | `GET /api/segmentasi/ringkasan`, `GET /api/segmentasi/cluster` |
| Forecasting | `GET /api/forecasting/rute-tersedia`, `POST /api/forecasting/run` (`{rute, horizon_hari, libur_akhir_pekan}`) |
| Performa Rute | `GET /api/performa-rute`, `GET /api/performa-rute/vip-vs-reguler` |

## 📝 Catatan Kontrak Data

Interface respons ada di `src/types/index.ts` (snake_case, Bahasa Indonesia). Bila nama
field dari backend berbeda, sesuaikan di file tersebut — komponen sudah defensif
(fallback `—`/0) sehatga UI tetap aman meski sebagian field belum tersedia.

Beberapa panel di **Dashboard** (mini-chart forecasting & ranking okupansi) akan memakai
field opsional dari `/summary` bila ada; jika tidak, ranking okupansi diturunkan dari
`/api/performa-rute` dan mini-chart menampilkan deret preview.

Modul API juga menerima dua bentuk respons list: **array polos** atau objek
`{ data: [...] }`, agar fleksibel terhadap gaya backend.

## 🚂 Deploy ke Railway

1. **New → GitHub Repo** (repo frontend ini) di project Railway yang sama dengan backend.
2. Tab **Variables**: `VITE_API_BASE_URL=https://<backend>.up.railway.app`
   (dibaca saat **build** — setelah mengubahnya, lakukan redeploy).
3. **Settings → Networking → Generate Domain**, lalu isi domain ini ke `FRONTEND_URL` di service backend.

Build `npm run build`, start `npm start` (`serve -s dist`, sudah menangani rute SPA). Lihat `railway.json`.
