# EviChain Frontend

Frontend untuk dApp chain of custody barang bukti digital. Dibuat dengan React + Vite.

## Menjalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`, lalu masuk lewat MetaMask (masih simulasi).

Akun untuk dicoba di halaman Pilih akun:

| Akun | Nama | Role |
| --- | --- | --- |
| Akun 1 | Rina Hartono | Admin |
| Akun 2 | Bima Prasetyo | Penyidik |
| Akun 3 | Dewi Lestari | Penyidik |
| Akun 4 | Andi Wijaya | Analis |
| Akun 5 | Sari Kusuma | Analis |
| Akun 6 | Hendra Gunawan | Auditor |
| Akun baru | | belum terdaftar, buat cek layar ditolak |

## Yang sudah jalan

- Login 3 langkah (hubungkan, pilih akun, tanda tangan SIWE) dan layar wallet belum terdaftar
- Dashboard penyidik dan dashboard admin
- Daftar barang bukti dengan pencarian dan filter status
- Detail bukti: transfer custody, ubah status, edit metadata, jejak custody, cek integritas cepat
- Registrasi bukti, hash SHA-256 dihitung langsung di browser
- Verifikasi integritas file atau hash yang ditempel, beserta riwayatnya
- Kasus, detail kasus, tambah dan edit kasus
- Pengguna (tambah, edit, hapus) dan log aktivitas untuk admin
- Profil dan sesi login

Menu menyesuaikan role. Registrasi hanya untuk Penyidik, Pengguna dan Log hanya untuk Admin.

## Data dan blockchain

Semua data masih dari `src/data/seed.js` dan disimpan di memori, jadi kembali ke awal kalau halaman di-refresh.

Transaksi juga masih tiruan. Popup MetaMask, nomor blok, dan hash tx dibuat di `src/lib/chain.js` dan `src/store/AppStore.jsx`. Kalau kontrak `EvidenceRegistry` sudah deploy di Sepolia, yang perlu diganti:

1. `requestTx` di `AppStore.jsx` diganti pemanggilan kontrak lewat ethers.js
2. alamat kontrak di `CONTRACT` (`src/lib/chain.js`)
3. data awal diambil dari event kontrak, bukan dari `seed.js`

## Struktur

```
src/
  components/   bagian visual yang dipakai ulang (map, label bukti, kertas sambung, papan klip, dll)
  pages/        satu file per halaman, admin di pages/admin
  store/        state aplikasi dan aksi
  data/         data contoh
  lib/          format tanggal, hash, helper
  styles/       warna, font, komponen dasar
```

## Build

```bash
npm run build
```

Hasilnya di folder `dist`. Karena pakai BrowserRouter, hosting perlu diarahkan semua path ke `index.html` (di Vercel atau Netlify ini otomatis untuk project Vite, kalau tidak tambahkan rewrite).
