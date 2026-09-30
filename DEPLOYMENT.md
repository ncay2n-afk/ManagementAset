# Panduan Lengkap Deploy ke Vercel (vercel.app)

Aplikasi **AsetKantor Enterprise** berbasis **Vite + React (SPA)**. Konfigurasi `vercel.json` telah disiapkan di root direktori agar proses build dan routing otomatis berjalan lancar.

---

## Opsi 1: Deploy Otomatis via GitHub (Paling Direkomendasikan)

1. **Push Proyek ke GitHub**:
   Jika belum di-push ke GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: setup vercel configuration and enterprise asset management"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO_NAME.git
   git push -u origin main
   ```

2. **Buka Vercel Dashboard**:
   - Masuk ke akun Anda di [https://vercel.com](https://vercel.com).
   - Klik tombol **"Add New..."** lalu pilih **"Project"**.
   - Pilih repository GitHub Anda yang baru di-push.

3. **Konfigurasi Project di Vercel**:
   - **Framework Preset**: `Vite` (akan terdeteksi otomatis).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - Klik **"Deploy"**.

4. **Selesai!**
   Dalam 1-2 menit, aplikasi Anda akan online di domain seperti:
   `https://nama-aplikasi.vercel.app`

---

## Opsi 2: Deploy Cepat via Vercel CLI

Jika Anda ingin langsung mendeploy dari terminal komputer:

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login ke Akun Vercel**:
   ```bash
   vercel login
   ```

3. **Jalankan Perintah Deploy**:
   ```bash
   vercel
   ```
   *Ikuti petunjuk di terminal (pilih default untuk semua pertanyaan).*

4. **Deploy ke Production**:
   ```bash
   vercel --prod
   ```

---

## ⚠️ LANGKAH PENTING: Autentikasi Google & Firebase di Domain Vercel

Agar fitur **Login Google**, **Upload Foto ke Google Drive**, **Sinkronisasi Google Sheets**, dan **Notifikasi Gmail** dapat berfungsi di domain Vercel Anda (`https://nama-aplikasi.vercel.app`):

### 1. Tambahkan Domain ke Firebase Console (Authorized Domains)
1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Pilih proyek Anda: `gen-lang-client-0092700881`.
3. Buka menu **Authentication** > tab **Settings** > **Authorized domains**.
4. Klik **Add domain**, lalu masukkan domain Vercel Anda (contoh: `nama-aplikasi.vercel.app`).
5. Klik **Save**.

### 2. Tambahkan Origin ke Google Cloud Console (OAuth Client ID)
1. Buka [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Cari OAuth 2.0 Client ID aplikasi ini.
3. Di bagian **Authorized JavaScript origins**, tambahkan:
   - `https://nama-aplikasi.vercel.app`
4. Di bagian **Authorized redirect URIs**, tambahkan:
   - `https://nama-aplikasi.vercel.app`
   - `https://gen-lang-client-0092700881.firebaseapp.com/__/auth/handler`
5. Klik **Save**.

---

## Ringkasan File Konfigurasi Vercel (`vercel.json`)
File `vercel.json` yang telah dibuat berisi:
- **`framework: "vite"`**: Mengarahkan Vercel menggunakan pipeline Vite.
- **`rewrites`**: Menangani Client-Side Routing React SPA (agar tidak 404 saat merefresh halaman).
- **`headers`**: Menyediakan caching optimal untuk aset statis (`/assets/*`) dan proteksi header keamanan (`X-Content-Type-Options`, `X-XSS-Protection`).
