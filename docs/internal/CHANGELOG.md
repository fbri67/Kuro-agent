# Changelog kerja internal

Bukan changelog rilis. Changelog pengguna tetap [CHANGELOG.md](../../CHANGELOG.md).

## Continuation 2026-10-12

- Mengidentifikasi baseline penuh: 1.398 test, 6 gagal, 1 dilewati; kegagalan berasal dari kontrak rename/storage lama dan environment KURO child.
- Menghasilkan regresi red-to-green untuk root data privat/exception bersarang, child environment Kuro/Ruko, sanitizer background, dan storage root symlink.
- Memverifikasi compatibility data melalui operasi nyata subsistem pada fixture sementara, bukan hanya equality path.
- Memperbarui test pesan BLOCKED Kuro, direktori host baru `.kuro`, dan penolakan traversal eksplisit root data di glob.
- Menyediakan jalur baca terpisah contributor/auditor; mengurangi duplikasi CONTRIBUTING/SECURITY dan memperbaiki klaim trust/migrasi di README.
- Menghapus statistik historis dari changelog pengguna sebagai sumber status terkini; hasil baru dicatat di QA.
- Metadata package-lock yang tertinggal diselaraskan dengan manifest Kuro, ditambah assertion identitas/version/biner; hash dan versi dependency tidak disentuh.

Catatan lama yang sudah dihapus pada working tree awal tidak direkonstruksi sebagai hasil verifikasi sesi ini. Source upstream masih memiliki history aslinya; status register finding tidak diturunkan dari catatan bot.
