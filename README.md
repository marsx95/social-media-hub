# Social Media Hub

Tracker produksi konten untuk Amar, Nduy, Arin, GPT, dan Aldyan. Periode **November 2026–April 2027**, dengan persiapan draft November pada akhir Oktober.

## Mulai

Memerlukan Node.js 20 atau lebih baru. Tidak perlu install dependency untuk mode lokal.

```sh
npm run dev
# atau
node scripts/serve.mjs
```

Buka `http://127.0.0.1:4173`. Pada awal pemakaian, rencana kerja dimasukkan ke penyimpanan browser.

```sh
node --test tests/*.test.mjs
node scripts/build.mjs
```

Situs dapat langsung di-host GitHub Pages dari root branch `main` (lihat [docs/FIREBASE.md](docs/FIREBASE.md) bagian 6). Hasil build untuk Firebase Hosting terdapat di `dist/`. Folder ini siap di-host sebagai situs statis. `firebase.json` sudah menunjuk folder tersebut.

## Yang tersedia

- Ringkasan lima brand, papan produksi, filter brand/periode/assignee/format, pencarian, dan kalender deadline.
- Assignee Amar, Nduy, Arin, GPT, Aldyan; PIC dan assignee subtask dapat berbeda.
- Tugas, prioritas, deadline, kendala, prasyarat, brief, caption, tautan Drive, subtask, komentar, dan riwayat revisi.
- Approval draft, storyboard/keyframe, dan final oleh Aldyan.
- 64 slot draft November (8 carousel/static + 8 reels × 4 brand), 21 pekerjaan fondasi, serta satu slot draft awal Djakarta Padel.
- Karnos Visual Magic dan Karnos Film menunggu KV. MEGAN memiliki prasyarat brief/format. Rimba Raya dapat langsung mengembangkan draft dari idea bank yang tersedia.
- Notifikasi email lewat EmailJS ke PIC dan Aldyan, lihat [docs/EMAIL.md](docs/EMAIL.md).
- Ekspor cadangan JSON dan impor yang hanya menambahkan ID baru.
- Adapter Firebase Auth + Firestore dengan transaksi dan deteksi perubahan bersamaan, beserta aturan akses untuk persiapan integrasi.

**Slot draft adalah rencana pekerjaan, bukan draft konten yang sudah ditulis.** Kuantitas dan tanggal awal adalah rencana berdasarkan brief, dapat disesuaikan tim. November berisi rencana awal; periode Desember–April tersedia untuk penambahan pekerjaan berikutnya.

## Alur

1. Idea bank → draft konten → review Aldyan → draft disetujui.
2. Carousel/static: produksi desain + copywriting/caption → review final → siap posting.
3. Reels: storyboard + keyframe dalam PPT → review Aldyan → generasi video oleh Aldyan/tim Higgsfield → editing, sound design, caption → review final → siap posting.
4. Djakarta Padel: format/idea bank → draft → review Aldyan → diserahkan ke Amar. Pekerjaan desain/reels selanjutnya dikerjakan Amar.
5. Fondasi/branding: belum mulai → dikerjakan → review Aldyan → selesai.

Tautan hasil diperlukan sebelum pengajuan final. Revisi harus disertai catatan. Perubahan draft atau aset setelah approval mengembalikan pekerjaan ke tahap terkait untuk direview ulang. Perubahan PIC/deadline tidak membatalkan approval.

**GPT hanya label assignee.** Tidak ada pemanggilan API AI, generasi otomatis, posting, atau pesan otomatis ke anggota tim. Upload sosial media dilakukan Aldyan di luar tracker.

## Lokal dan kolaborasi

**Mode lokal:** data disimpan di browser/perangkat yang sama. Pilihan “lihat sebagai” adalah simulasi peran; ini bukan login aman. Tab pada browser yang sama menerima perubahan melalui storage event. Cadangkan data sebelum menghapus data situs/browser. Mode lokal tidak menyinkronkan data ke perangkat tim lain.

**Mode Firebase:** aktif setelah konfigurasi, aktivasi Google Sign-in, pemasangan rules, dan pendaftaran UID anggota. Identitas Aldyan berasal dari daftar anggota yang hanya dapat dikelola dari lingkungan admin, bukan dropdown browser. Panduan lengkap: [docs/FIREBASE.md](docs/FIREBASE.md).

File kreatif tetap berada di Drive. Repo ini tidak memuat PPTX, video, keyframe, token, service account, atau isi lengkap idea bank milik klien.

## Struktur kode

| File | Fungsi |
| --- | --- |
| `src/model.js` | Model, rencana awal, validasi, transisi workflow |
| `src/app.js` | UI dan interaksi |
| `src/styles.css` | Tampilan responsif |
| `src/store.js` | Penyimpanan lokal dan adapter Firebase |
| `src/config.js` | Konfigurasi Firebase opsional |
| `firestore.rules` | Pembatasan anggota, status approval dan perubahan data |
| `tests/workflow.test.mjs` | Pengujian alur produksi dan validasi |

## Batas verifikasi

Workflow lokal diuji dengan Node dan interaksi browser. Firebase Auth/Firestore belum dihubungkan ke project nyata; sinkronisasi dan rules perlu diuji dengan Firebase Emulator serta project yang dipilih sebelum tim memasukkan data operasional. Detail aturan dan langkah verifikasi ada di panduan Firebase.

UI tersedia dalam Bahasa Indonesia, waktu ditampilkan dalam WIB. Data berupa metadata dan tautan; tidak memerlukan penyimpanan media di Firebase Storage.

- Setiap kartu pekerjaan memiliki tautan langsung melalui tombol **Salin link**. URL menggunakan parameter `?task=<id>` dan langsung membuka detail pekerjaan setelah halaman dimuat.
