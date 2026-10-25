# Menyambungkan Firebase

Integrasi disiapkan untuk tahap setelah repository selesai. Aplikasi tetap berjalan lokal ketika `firebaseConfig` bernilai `null`.

## 1. Siapkan project

1. Buat atau pilih Firebase project milik Amar.
2. Tambahkan aplikasi Web dan salin konfigurasi web dari Project settings.
3. Aktifkan Authentication → Sign-in method → Google.
4. Buat Cloud Firestore dan pilih lokasi yang sesuai. Pasang rules dari repo ini sebelum membuka aplikasi ke tim. Jangan gunakan rules yang membolehkan semua orang membaca/menulis.
5. Tambahkan domain hosting/custom domain pada daftar Authorized domains di Authentication. Untuk pengujian lokal, tambahkan `localhost` dan/atau `127.0.0.1` sesuai domain yang dipakai.

## 2. Isi konfigurasi

Edit `src/config.js`:

```js
export const firebaseConfig = {
  apiKey: 'WEB_API_KEY_DARI_FIREBASE',
  authDomain: 'PROJECT_ID.firebaseapp.com',
  projectId: 'PROJECT_ID',
  appId: 'WEB_APP_ID',
};
export const workspaceId = 'production';
export const firebaseSdkVersion = '12.19.0';
```

Konfigurasi aplikasi web merupakan identifier publik. Jangan menaruh private key/service account/admin credential ke file ini. Keamanan data ditentukan oleh Authentication dan Firestore Rules.

SDK browser dimuat dari CDN Firebase hanya ketika konfigurasi aktif. Versi dipin agar perubahan SDK tidak terjadi diam-diam. Untuk produksi yang lebih besar, pertimbangkan bundler sesuai panduan Firebase.

## 3. Daftarkan anggota

Minta setiap orang login sekali dengan Google. UID akun ditampilkan jika belum terdaftar. Dari **Firestore Console menggunakan akses admin**, buat dokumen:

`workspaces/production/members/<FIREBASE_AUTH_UID>`

Isi satu field `personId` sesuai identitas:

| Orang | personId |
| --- | --- |
| Amar | `amar` |
| Nduy | `nduy` |
| Arin | `arin` |
| Aldyan | `aldyan` |

Jangan mendaftarkan akun GPT. GPT hanya assignee. Pastikan UID Aldyan benar; identitas ini yang berhak approve. Aplikasi klien tidak dapat membuat atau mengubah dokumen anggota sendiri.

Setelah anggota terdaftar, login ulang. Amar dapat membuka Workspace & data → Isi rencana awal workspace ketika Firestore masih kosong. Data lokal tidak dikirim ke cloud secara otomatis. Ekspor data lokal sebelum beralih; migrasi pekerjaan yang sudah digunakan perlu dilakukan melalui proses admin yang diverifikasi terpisah.

## 4. Build, uji, dan deploy

Gunakan Firebase CLI resmi pada komputer yang sudah login ke akun pemilik project:

```sh
node --test tests/*.test.mjs
node scripts/build.mjs
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes,hosting
```

Jalankan pengujian rules pada Firebase Emulator sebelum penggunaan tim. Rules yang disediakan belum pernah dipasang atau dijalankan pada project milik pengguna dalam implementasi awal ini.

Kasus yang harus diuji pada emulator/project pengujian:

- Pengguna belum login dan pengguna tanpa membership ditolak membaca/menulis tasks.
- Anggota hanya dapat membaca dokumen membership miliknya; tidak dapat menaikkan peran sendiri.
- Amar/Nduy/Arin tidak dapat menyetujui draft/storyboard/final, bahkan lewat request langsung.
- Aldyan dapat menyetujui transisi valid; status tidak dapat melompati tahap.
- Perubahan brief/aset membatalkan approval terkait.
- Riwayat tidak bisa dihapus/diubah; actor event harus sama dengan personId yang terautentikasi.
- Prasyarat yang belum selesai menahan perubahan tahap; Karnos tetap memerlukan KV meski daftar prasyarat diubah.
- Dua penulis dengan revision yang sama: penulis kedua mendapat konflik dan harus membuka ulang detail.
- Tidak ada akses lintas workspace tanpa membership.

Rules memeriksa alur, field, akses, dan prasyarat. Pemeriksaan detail semua entri subtask dan tanggal kalender penuh juga dilakukan di aplikasi. Keputusan final tetap dilakukan oleh Aldyan saat meninjau hasil. Timestamp riwayat merupakan waktu dari perangkat dan bukan bukti waktu server yang diaudit.

## 5. Custom domain

Setelah hosting berfungsi, gunakan Firebase Console → Hosting → Add custom domain. Ikuti record DNS dan verifikasi yang diberikan Firebase untuk domain yang dipilih. Tambahkan domain tersebut ke Authorized domains di Authentication, kemudian uji login dan sinkronisasi dengan dua akun berbeda.

Rencana biaya mengikuti produk, kuota, dan konfigurasi project Firebase yang dipilih. Tracker menyimpan metadata/link, bukan file video/gambar; tidak ada backend AI atau Firebase Storage dalam versi ini.

## 6. Hosting lewat GitHub Pages (custom domain)

Repo ini bisa langsung disajikan GitHub Pages tanpa build: `index.html` dan `src/` ada di root, dan `.nojekyll` sudah tersedia.

1. GitHub → repo `social-media-hub` → Settings → Pages → Source: **Deploy from a branch**, Branch: `main`, folder `/ (root)`.
2. Di bagian Custom domain, isi domain kamu lalu ikuti record DNS yang diminta GitHub (CNAME untuk subdomain, atau A record untuk domain utama). Centang **Enforce HTTPS** setelah sertifikat aktif.
3. Tambahkan domain tersebut (dan `marsx95.github.io`) ke Firebase Console → Authentication → Settings → **Authorized domains**, supaya login Google berfungsi.
4. Setiap push ke `main` otomatis memperbarui situs.

Firebase Hosting (bagian 4–5) tetap bisa dipakai sebagai alternatif; pilih salah satu saja untuk domain yang sama.

## Referensi resmi

- [Setup Firebase untuk web](https://firebase.google.com/docs/web/setup)
- [Conditions pada Firestore Rules](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Pembatasan field dan perubahan data](https://firebase.google.com/docs/firestore/security/rules-fields)
- [Firebase Hosting](https://firebase.google.com/docs/hosting/)
