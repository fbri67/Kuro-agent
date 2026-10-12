# Progress internal maintainer

Bukan panduan kontributor. Kontrak publik ada di `docs/contributor/` dan status audit ada di `docs/auditor/FINDINGS.md`.

## Checkpoint 2026-10-12

- Melanjutkan working tree Kuro dari branch source `feat/rich-architecture-upgrade`; remote upstream Ruko tidak diubah.
- Menyelesaikan kompatibilitas path `.kuro`/`.ruko` dengan test config, history, memory, session, skills, undo, recovery checkpoint, dan global trust pada HOME terisolasi.
- Menyatukan klasifikasi root data privat untuk tool/undo; exception skills luar tidak membuka root privat bersarang.
- Menyatukan sanitasi environment foreground/background; kedua prefix privat ditolak tanpa pengecualian test. Environment aplikasi biasa tetap tersedia.
- Test identitas/lokasi diperbarui untuk Kuro tanpa melemahkan penolakan keamanan.
- Root storage symlink/non-direktori ditolak, termasuk path config yang sudah ada lewat symlink. Regresi root symlink terlihat gagal sebelum fix dan lulus setelahnya.
- Suite penuh di Node 18.20.8 dan 24.21.0 memakai HOME sementara dan lulus. Fixture child background diberi ref/timeout agar test tidak dibatalkan oleh Node 18; primitive background tidak diubah untuk fixture.
- Dokumentasi baru: empat halaman kontributor, empat halaman auditor, dan pemisahan catatan kerja internal.

## Review yang dilaksanakan

Review subprocess Hermes terpisah bersifat read-only dan terbatas pada modul keamanan/runtime; bukan audit seluruh diff. Temuan root storage symlink ditindaklanjuti. Catatan environment provider/non-product diwariskan dan seleksi mixed-root adalah batas yang dijelaskan di KNOWN-LIMITS, bukan klaim sandbox atau merge data otomatis.

## Acceptance sebelum publikasi

- Build/typecheck/suite penuh, E2E/file URL, dependency audit, smoke CLI/PTTY: terverifikasi lokal.
- Tautan dokumentasi dan daftar file publikasi bersih dari data/secret/build.
- Salinan Git tujuan terpisah mengikutsertakan perubahan dirty/untracked yang dimaksud; tidak mem-push history source atau data lokal.
- Repo tujuan tepat `fbri67/Kuro-agent`; read-back commit/branch setelah push. Tidak membuat tag/release tanpa permintaan.

Hasil aktual tiap pemeriksaan dicatat di [QA.md](QA.md). Risiko operasional terbuka: concurrency checkpoint lintas sesi workspace, power-loss durability, serta review cakupan lock seluruh pemanggil host-state.
