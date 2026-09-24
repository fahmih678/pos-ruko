# POS Ruko - Aplikasi Kasir Mobile-First

Aplikasi Point of Sale (POS) modern berbasis web yang dirancang khusus untuk operasional toko kelontong, minimarket ruko, dan retail kecil. Dioptimalkan untuk penggunaan layar sentuh smartphone/tablet kasir maupun laptop/PC.

---

## 🚀 Fitur Utama

### 1. Panel Kasir (Tampilan Utama)
- **Katalog Cepat**: Grid produk dengan status stok, foto/ikon, dan filter kategori berbasis tag geser.
- **Scan Barcode Kamera**: Scan barcode/QR langsung menggunakan kamera smartphone kasir tanpa alat scanner terpisah.
- **Keranjang Belanja Mobile**: Drawer keranjang belanja dengan kontrol jumlah item cepat (+/-).
- **Multi Pembayaran**:
  - **Tunai (Cash)**: Shortcut nominal uang pas (10rb, 20rb, 50rb, 100rb) dan kalkulasi kembalian otomatis.
  - **QRIS**: Tampilan informasi scan QRIS toko.
  - **Transfer Bank**: Catatan konfirmasi pembayaran rekening ruko.
- **Struk Belanja Digital & Fisik**:
  - Cetak struk ramah printer thermal ukuran 58mm / 80mm via Web Print.
  - Opsi bagikan struk via **WhatsApp** ke nomor pelanggan.

### 2. Manajemen Produk, Harga & Stok (COGS)
- Pencarian produk instan berdasarkan nama dan barcode/SKU.
- Pembedaan **Harga Modal (COGS)** dan **Harga Jual**.
- Indikator peringatan stok menipis (Low Stock Alert).
- Tambah, ubah, dan nonaktifkan produk (khusus Pemilik).

### 3. Rekap Harian & Sistem Shift Kasir
- **Shift Kasir**: Input modal kas awal sebelum mulai berjualan dan rekonsiliasi uang fisik saat tutup kasir.
- **Rekap Harian Toko**:
  - Total omset penjualan harian.
  - Estimasi **Laba Kotor** (Omset - Modal) & Margin Keuntungan (%).
  - Breakdown metode bayar (Tunai vs QRIS vs Transfer).
  - Peringkat 10 produk paling laris.
  - **Ekspor Laporan ke Excel (.xlsx)**.

### 4. Pengaturan Toko Sederhana
- Profil Toko: Nama ruko, alamat, no. telepon/WA, dan catatan kaki struk belanja.
- Pengaturan QRIS toko.
- Kelola akun kasir dan ganti password.

---

## 👥 Akun Bawaan (Demo)

Aplikasi telah dilengkapi dengan data demo siap pakai:

| Role | Email / Username | Password | Hak Akses |
|---|---|---|---|
| **Pemilik Toko** | `owner@tokoruko.com` | `owner123` | Akses penuh (Semua menu, laba, edit produk, pengaturan) |
| **Kasir** | `kasir@tokoruko.com` | `kasir123` | Kasir, Scan barcode, Riwayat struk, Buka/Tutup Shift (Harga modal & laba disembunyikan) |

---

## 🛠️ Cara Menjalankan

### Mode Pengembangan Lokal (Laptop saja)
```bash
npm run dev
```
Akses di browser: `http://localhost:3000`

### 📱 Mode Pengembangan Mobile (Akses via HP di 1 Wi-Fi)
Gunakan perintah ini agar aplikasi dapat dibuka dari HP/tablet di jaringan Wi-Fi yang sama dengan **dukungan HTTPS** (wajib untuk mengaktifkan **Kamera Barcode Scanner**):
```bash
npm run dev:lan
```
1. Script akan otomatis mendeteksi alamat IP lokal laptop/komputer Anda (misal: `https://10.64.37.85:3000`) dan menampilkan **QR Code** langsung di layar terminal.
2. Arahkan kamera HP Anda ke QR Code di terminal untuk membuka tautan.
3. **Penting**: Saat muncul peringatan *"Koneksi tidak pribadi / Not Private"* di browser HP (karena sertifikat self-signed lokal):
   - Klik tombol **Lanjutan** / **Advanced**.
   - Klik tautan **Lanjutkan ke situs (tidak aman)** / **Proceed**.
4. Aplikasi kasir siap digunakan di HP dengan izin kamera barcode scanner aktif!

### Mode Pengembangan HTTP (Alternatif tanpa HTTPS)
```bash
npm run dev:http-lan
```

### Mode Produksi (Production)
```bash
npm run build
npm run start
```

### Reset / Seed Ulang Database
```bash
npx prisma db push
npm run db:seed
```

