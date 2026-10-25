// Isi dari Firebase Console > Project settings > Your apps > Web app.
// Konfigurasi web bukan service-account key. Akses data tetap dilindungi firestore.rules.
export const firebaseConfig = {
  apiKey: 'AIzaSyAlFlZJWSYkWYxUJA6SPA3JwdNBhgR12-M',
  authDomain: 'triplea-ff5a4.firebaseapp.com',
  projectId: 'triplea-ff5a4',
  storageBucket: 'triplea-ff5a4.firebasestorage.app',
  messagingSenderId: '1029892361110',
  appId: '1:1029892361110:web:ea0162cb6bf67ffecc2bb7',
};
// Notifikasi email lewat EmailJS (gratis 200 email/bulan). Kosongkan untuk mematikan.
// Ambil dari dashboard EmailJS: Account → Public Key, Email Services → Service ID, Email Templates → Template ID.
export const emailjsConfig = {
  publicKey: '',
  serviceId: '',
  templateId: '',
};
export const workspaceId = 'production';
export const firebaseSdkVersion = '12.19.0';
