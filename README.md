# Aksara — Praktikum Kriptografi

Aplikasi web lokal berbahasa Indonesia, dibuat dengan HTML, CSS, dan JavaScript tanpa framework atau dependensi tambahan. Semua pemrosesan berlangsung di browser. Tidak ada unggahan data ke server, penyimpanan kunci, atau layanan eksternal.

## Menjalankan

1. Pasang Node.js 22 atau lebih baru.
2. Buka terminal di folder aplikasi ini.
3. Jalankan `npm start` (atau `node server.mjs`).
4. Buka http://localhost:4173 di browser. Hentikan server dengan Ctrl+C.

Di Windows bisa juga klik dua kali `Jalankan Aksara.cmd` setelah Node.js terpasang. Tidak perlu `npm install` atau koneksi internet untuk menjalankan aplikasi.

## Cara menggunakan

1. Pilih Enkripsi atau Dekripsi, lalu pilih cipher.
2. Ketik pesan atau pilih file (maksimal 20 MB).
3. Masukkan kunci. Affine memakai dua bilangan; Hill memakai matriks 2 × 2.
4. Jalankan proses. Hasil ditampilkan dalam Base64 secara default; tersedia tampilan teks dan hex.
5. Salin hasil, gunakan sebagai input untuk operasi kebalikan, atau unduh byte hasil.

Untuk dekripsi hasil yang disalin, pilih format masukan **Base64**. Untuk dekripsi file `.dat` yang diunduh, pilih tab **File**; file dibaca sebagai byte mentah, tidak di-decode dari Base64. Gunakan cipher dan kunci yang sama. Tidak ada deteksi otomatis kunci salah pada cipher klasik.

File besar hanya ditampilkan 100.000 byte pertama; tombol salin dan unduh tetap mengambil hasil lengkap. Tampilan teks pada byte biner dapat memuat karakter pengganti; gunakan Base64 atau hex untuk membaca nilainya.

## Algoritma

| Cipher | Kunci dan aturan |
| --- | --- |
| Vigenere | Kunci alfabet diulang; Cᵢ = (Pᵢ + Kᵢ) mod 26. |
| Auto-Key Vigenere | Kunci awal dilanjutkan oleh plainteks, bukan cipherteks. |
| Extended Vigenere | Seluruh byte 0–255 diproses modulo 256. Kunci teks diubah menjadi byte UTF-8. |
| Playfair | Tabel 5 × 5, J → I. Sisipan X pada pasangan sama/akhir ganjil, Q jika hurufnya X. |
| Affine | C = (aP + b) mod 26; gcd(a, 26) harus 1. |
| Hill | Matriks 2 × 2 dikalikan vektor kolom huruf modulo 26. Determinan harus relatif prima dengan 26. Padding X. |
| Super Enkripsi | Extended Vigenere lalu transposisi kolom tanpa padding. Kolom diurutkan menurut nilai Unicode kunci; karakter sama diurutkan menurut posisi asal. Dekripsi membalik urutan tahap. |

Cipher alfabet mengambil huruf ASCII A–Z saja dan menghasilkan huruf kapital. Spasi, tanda baca, angka, dan huruf non-ASCII dihapus sebelum operasi. Karena itu, dekripsi mengembalikan teks yang sudah dinormalisasi, bukan format awalnya. Kunci alfabet dapat sepanjang apa pun selama mengandung minimal satu huruf. Hill dan Affine memiliki bentuk kunci matematis tetap.

Playfair memakai konvensi umum 25 sel untuk masukan 26 huruf (I/J digabung). Sisipan Playfair dan Hill **tidak dihapus otomatis**: X/Q dapat merupakan huruf asli. Contoh BALLOON menjadi BALXLOON setelah persiapan Playfair; CAT menjadi CATX pada Hill. Enigma dan Ruby adalah bonus pada soal dan tidak diimplementasikan.

## File biner: gambar, database, audio, video

Gunakan **Extended Vigenere** atau **Super Enkripsi**. Semua byte, termasuk header, diproses. Cipher alfabet ditujukan untuk teks UTF-8; aplikasi menolak file yang terdeteksi biner pada mode tersebut. Cipher alfabet tidak dapat mempertahankan file sembarang setelah normalisasi.

Contoh alur: pilih `foto.jpg` → Extended Vigenere → kunci `RAHASIA` → unduh `foto.jpg.dat`. Pilih Dekripsi, unggah hasil itu, gunakan kunci sama, lalu unduh `foto.jpg`. Nama keluaran dapat diedit. Pola yang sama berlaku untuk `.db`, `.mp3`, `.mp4`, dan format lain. Metadata nama tidak ditanam dalam isi ciphertext: nama asal dipertahankan lewat akhiran `.dat` pada nama file. Jika ciphertext diganti namanya, isi nama dan ekstensi hasil dekripsi secara manual.

Base64 bersifat case-sensitive; mengubahnya menjadi huruf besar/kecil seluruhnya merusak data. Yang dikapitalisasi adalah keluaran cipher alfabet sebelum dikodekan ke Base64. Base64 standar dipertahankan agar dapat dipulihkan dengan benar.

## Contoh uji

| Algoritma | Plainteks | Kunci | Cipherteks (sebelum Base64) |
| --- | --- | --- | --- |
| Vigenere | ATTACKATDAWN | LEMON | LXFOPVEFRNHR |
| Auto-Key | ATTACKATDAWN | QUEENLY | QNXEPVYTWTWP |
| Affine | AFFINECIPHER | a=5, b=8 | IHHWVCSWFRCP |
| Hill | HELP | 3,3 / 2,5 | HIAT |
| Playfair | HIDETHEGOLDINTHETREESTUMP | PLAYFAIR EXAMPLE | BMODZBXDNABEKUDMUIXMMOUVIF |

Jalankan `npm test` untuk memeriksa vektor yang diketahui, validasi kunci, padding, transposisi, Base64, dan pemulihan file biner byte demi byte.

## Struktur kode

- `cipher.js`: implementasi algoritma dan konversi byte/Base64.
- `app.js`: interaksi antarmuka, input file, pratinjau, dan unduhan.
- `index.html` dan `style.css`: antarmuka responsif.
- `server.mjs`: server lokal dengan daftar file yang diizinkan.
- `tests/cipher.test.js`: pengujian otomatis dengan Node.js.

## Referensi konsep

- University of Denver, Cryptographer's Toolkit Help: https://www.cs.du.edu/~petr/cryptographers_toolkit/cryptographers_toolkit_help.html
- PBS NOVA, The Playfair Cipher: https://www.pbs.org/wgbh/nova/decoding/playfair.html

Kode algoritma ditulis untuk proyek ini, tanpa pustaka implementasi cipher. Desain UI tidak menyalin tata letak referensi dosen. Pahami dan sesuaikan kode sebelum pengumpulan; pernyataan kepengarangan dan penggunaan bantuan harus mengikuti ketentuan kelas.
