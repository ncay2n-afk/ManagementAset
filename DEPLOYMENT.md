# Panduan Lengkap Deploy ke GitHub Pages (Hosting GitHub)

Aplikasi **AsetKantor Enterprise** kini telah dikonfigurasi untuk hosting otomatis menggunakan **GitHub Pages**.

Workflow GitHub Actions resmi telah disiapkan di `.github/workflows/deploy.yml` dan `vite.config.ts` telah diatur dengan `base: './'` agar semua file CSS, JS, dan gambar otomatis terbaca di domain GitHub Anda.

---

## Langkah 1: Push Kode ke Repository GitHub

1. Buka terminal proyek Anda dan lakukan inisialisasi / commit:
   ```bash
   git add .
   git commit -m "feat: setup github pages workflow and clean navigation UI"
   ```

2. Hubungkan ke repository GitHub Anda (jika belum):
   ```bash
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git branch -M main
   git push -u origin main
   ```

---

## Langkah 2: Aktifkan GitHub Pages di Repository

1. Buka repository Anda di browser: `https://github.com/USERNAME/NAMA-REPO`.
2. Klik tab **Settings** (Pengaturan repo).
3. Di menu sebelah kiri, pilih **Pages** (di bawah bagian *Code and automation*).
4. Pada bagian **Build and deployment** > **Source**:
   * Ubah dari *"Deploy from a branch"* menjadi **"GitHub Actions"**.
5. Selesai! Workflow akan otomatis berjalan dan mendeploy aplikasi Anda setiap kali Anda melakukan `git push` ke branch `main`.

Setelah 1-2 menit, URL website Anda akan aktif di:
👉 **`https://USERNAME.github.io/NAMA-REPO/`**

---

## Langkah 3: Konfigurasi Otorisasi Domain di Firebase & Google Console

Agar fitur **Login Google**, **Upload Foto ke Google Drive**, dan **Notifikasi Gmail** bekerja di domain GitHub Pages Anda:

1. Buka [Firebase Console](https://console.firebase.google.com/) > Pilih project: `gen-lang-client-0092700881`.
2. Masuk ke **Authentication** > Tab **Settings** > **Authorized domains**.
3. Klik **Add domain**, lalu masukkan domain GitHub Pages Anda:
   * Contoh: `USERNAME.github.io`
4. Klik **Save**.

5. Buka [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials):
   * Cari OAuth 2.0 Client ID.
   * Di bagian **Authorized JavaScript origins**, tambahkan:
     * `https://USERNAME.github.io`
   * Di bagian **Authorized redirect URIs**, tambahkan:
     * `https://USERNAME.github.io/NAMA-REPO`
     * `https://gen-lang-client-0092700881.firebaseapp.com/__/auth/handler`
   * Klik **Save**.
