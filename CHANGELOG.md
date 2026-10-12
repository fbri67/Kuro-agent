# Changelog

Catatan perubahan untuk rilis Kuro yang terlihat oleh pengguna.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) dan versi rilis mengikuti [Semantic Versioning](https://semver.org/).

> **Status versi:** Rilis Kuro `v1.0.0` menandai baseline baru proyek saudara yang berasal dari [Iky969/Ruko-agent](https://github.com/Iky969/Ruko-agent). Tag di repositori ini independen dari tag upstream.
>
> Riwayat progress/changelog v2 lama dihapus saat dokumentasi dikonsolidasikan. Entri di bawah ini mendeskripsikan baseline source saat ini, bukan klaim bahwa versi tersebut sudah dirilis.

---

## [1.0.0] — 2026-10-12

### Ditambahkan
- Perintah `/map [path]` dan tool `repo_map` untuk ringkasan simbol serta relasi import lokal JavaScript/TypeScript berbasis AST.
- Checkpoint mutasi transaksi untuk memulihkan file yang sudah dicatat bila satu giliran agen gagal atau terputus.
- Panduan terpisah untuk kontributor (setup, arsitektur, aturan keamanan, review) dan auditor (urutan baca, threat model, known limits, findings berbasis bukti).

### Diubah
- Nomor versi source di `package.json`, `package-lock.json`, README, dan identitas HTTP User-Agent diselaraskan ke `1.0.0`.
- Dokumentasi fitur diperbarui agar sesuai dengan source saat ini, termasuk tiga dependency runtime langsung: `@babel/parser`, `@vscode/ripgrep`, dan `diff`.
- CLI, package, installer, dan repositori dibedakan sebagai Kuro; variabel `RUKO_*` dan penyimpanan `.ruko/` dipertahankan agar instalasi lama tetap dapat digunakan.
- Catatan versi, panduan kontribusi, dan kebijakan keamanan disederhanakan agar tidak menyajikan progress lama atau statistik test usang sebagai status terkini.
- Kontrak runtime dependency menjadi allowlist eksplisit, diuji terhadap manifest, lockfile, source, dan build.

### Diperbaiki
- Kedua root data `.kuro`/`.ruko` dilindungi oleh guard yang sama; root privat bersarang tidak menjadi terbuka hanya karena berada dalam subtree skills.
- Seleksi storage menolak root symbolic link/non-direktori, termasuk root legacy, alih-alih mengikuti targetnya.
- Environment subprocess foreground/background memakai sanitizer yang sama untuk kedua prefix product dan hook startup/loader.
- Test dan dokumentasi lokasi/trust diperbarui tanpa melemahkan kontrak penolakan; compatibility data legacy diuji dengan operasi persistence nyata.

### Dihapus
- `PROGRESS.md`, `PROGRESS2.md`, `CHANGELOGv2.md`, dan `CHANGELOGSv2.md` yang berisi checkpoint historis, status branch/PR usang, serta klaim zero-runtime-dependency yang tidak lagi sesuai.
- Changelog lama yang mencampur banyak catatan historis dan status kerja; file ini menjadi changelog utama.

### Verifikasi
Hasil nyata build/typecheck/test, audit dependency dan smoke CLI dicatat di [QA internal](docs/internal/QA.md). Statistik test lama bukan status source terbaru; hasil CI multi-OS harus diperiksa pada commit remote yang benar.
