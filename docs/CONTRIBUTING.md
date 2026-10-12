# Panduan kontribusi

Panduan dipisah menurut pembaca agar tidak perlu membaca semua kode atau catatan kerja.

## Kontributor

1. [SETUP](contributor/SETUP.md): install source, build, dan test dalam satu halaman.
2. [ARCHITECTURE](contributor/ARCHITECTURE.md): satu diagram alur dan daftar berkas kunci.
3. [SECURITY-RULES](contributor/SECURITY-RULES.md): kontrak approval, scope, lock, executor, dan path privat.
4. [REVIEW](contributor/REVIEW.md): alur PR, checklist, dan test wajib per area.

## Auditor

Mulai dari [START-HERE](auditor/START-HERE.md), lalu baca [THREAT-MODEL](auditor/THREAT-MODEL.md), [KNOWN-LIMITS](auditor/KNOWN-LIMITS.md), dan [FINDINGS](auditor/FINDINGS.md). Status temuan harus punya evidence source/test; jangan mengambilnya dari catatan bot.

## Maintainer

`docs/internal/` berisi checkpoint progress/changelog kerja dan QA. Ini bukan bacaan wajib kontributor atau auditor dan bukan pengganti kontrak keamanan atau changelog pengguna di root.

## Lisensi dan atribusi

- Lisensi utama tetap MIT. Pertahankan [LICENSE](../LICENSE), termasuk **Copyright (c) 2026 Ruko**, tanpa mengganti pemegang hak cipta upstream atau menambahkan pembatasan baru ke naskah lisensi.
- Kuro adalah fork/turunan dari [Iky969/Ruko-agent](https://github.com/Iky969/Ruko-agent). Perubahan nama dan kontribusi fork tidak memindahkan kepemilikan kode upstream atau menghapus atribusinya.
- Tinjau lisensi dependency langsung, transitif, paket opsional, serta binary yang didistribusikan sebelum menambah atau memperbaruinya. Jangan menganggap field `license` paket npm sudah mencakup seluruh komponen binary.
- Perbarui [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) saat versi atau komponen berubah. Jika dependency dibundel, pertahankan naskah lisensi, copyright, disclaimer, dan notice upstream yang berlaku dalam artefak distribusi.
- Pemeriksaan lisensi tidak menggantikan allowlist dependency atau review keamanan; bila lisensi tidak diketahui atau kewajibannya belum dipenuhi, selesaikan review sebelum distribusi.

Issue publik boleh untuk bug/fitur/diskusi non-sensitif. Untuk kerentanan belum dimitigasi, laporkan privat sesuai [Security Policy](../.github/SECURITY.md). Jangan commit secret/data runtime dan jangan merge/force-push tanpa otorisasi maintainer.
