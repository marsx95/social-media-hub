# Notifikasi email (EmailJS)

Tracker mengirim email langsung dari browser lewat [EmailJS](https://www.emailjs.com). Paket gratisnya mencakup 200 email per bulan, dan tidak membutuhkan paket Firebase berbayar.

## Kapan email terkirim

| Kejadian | Penerima |
| --- | --- |
| PIC pekerjaan diganti | PIC baru |
| Subtask diberikan ke seseorang | Anggota yang ditugaskan |
| Pekerjaan diajukan ke review draft, storyboard, atau final | Aldyan |
| Aldyan menyetujui atau meminta revisi | PIC pekerjaan, beserta catatan revisinya |

Email tidak dikirim ke orang yang melakukan perubahan itu sendiri, juga tidak ke GPT. Kalau email gagal terkirim, perubahan pekerjaan tetap tersimpan dan muncul pesan error.

## Setup (sekali saja)

1. Daftar di emailjs.com.
2. **Email Services → Add New Service → Gmail**. Hubungkan akun Gmail pengirim, lalu catat **Service ID**-nya.
3. **Email Templates → Create New Template**:
   - To Email: `{{to_email}}`
   - From Name: `Social Media Hub`
   - Subject: `{{subject}}`
   - Content:
     ```
     Halo {{to_name}},

     {{message}}

     Buka tracker: {{link}}
     ```
   Simpan template, lalu catat **Template ID**-nya.
4. **Account → General**: salin **Public Key**. Di menu Security, isi Allowed origins dengan domain tracker (misalnya `https://syscon.atriple.digital`) agar key tidak bisa dipakai di situs lain.
5. Isi `emailjsConfig` di `src/config.js` dengan tiga nilai tersebut. Public Key memang dirancang untuk dipakai di browser.
6. Pasang ulang `firestore.rules` (Firestore → Rules → tempel → Publish), karena ada aturan baru untuk koleksi `contacts`.
7. Login sebagai Amar, buka **Workspace & data → Notifikasi email**, isi email Amar, Nduy, Arin, dan Aldyan, lalu klik Simpan email.

Email anggota disimpan di Firestore pada `workspaces/production/contacts/<personId>`, bukan di repo publik. Semua anggota dapat membacanya, tetapi hanya Amar yang dapat mengubahnya.
