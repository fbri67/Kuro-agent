# Batasan yang diketahui

Daftar ini membedakan limit arsitektur dari defect. Jangan menutup finding baru hanya karena mirip judul limit: precondition/dampaknya harus sama dan dibuktikan. Tidak ada jaminan keamanan absolut dari test green.

## L1 — Policy aplikasi, bukan sandbox OS

`src/core/executor.ts:execute` dan `src/agent/processManager.ts:startProcess` menjalankan child dengan hak pengguna. `exec` precheck bukan analisis semantik seluruh shell/script npm. Subprocess masih dapat membawa environment non-product/provider yang tidak masuk denylist. Sanitasi `KURO_*`/`RUKO_*` tidak berarti seluruh secret host hilang. Gunakan container/VM non-root tanpa mount pribadi dan egress filtering untuk kode asing.

## L2 — Plaintext dan redaksi heuristik

Config, transkrip, memory, undo dan checkpoint tidak dienkripsi. Mode POSIX owner-only adalah mitigasi akses, bukan enkripsi; ACL Windows memerlukan penilaian deployment terpisah. `src/core/history.ts:redactHistoryEntry`, `src/core/logging/redactionStream.ts`, dan `src/agent/processManager.ts:redactCredentials` tidak menangkap token arbitrer tanpa pola yang dikenal. Jangan menganggap log/backup aman untuk dipublikasikan.

## L3 — Race filesystem lintas platform

Containment/lstat/realpath dan operasi I/O tidak selalu atomik terhadap proses same-user yang mengganti symlink/ancestor di antara pemeriksaan. `src/core/tools/secureRead.ts` menambah pemeriksaan pembacaan; mutasi dan Windows tidak memiliki jaminan kernel universal. Scope fisik yang benar bukan klaim hilangnya semua TOCTOU.

## L4 — Lock sesi bukan lock workspace global

`src/core/securityPipeline.ts` mengunci state sesi tertentu. Checkpoint memakai satu `checkpoints/active` di workspace; tidak ada workspace-wide concurrency lock pada `src/core/mutationCheckpoint.ts`. Hindari menjalankan beberapa sesi mutasi di workspace yang sama. Operasi `runOwned()` dilindungi nonce, tetapi jangan mengasumsikan setiap pemanggil `saveHostState()` memakai jalur itu; transisi mode/command perlu ditinjau tersendiri.

## L5 — Rollback terbatas dan durability

Checkpoint memulihkan file yang dicapture (batas 500 file/64 MiB), bukan file lain yang diubah script, efek jaringan, state git keseluruhan, atau lifecycle proses. Direktori baru/metadata filesystem tidak seluruhnya dipulihkan. Journal `writeAtomic()` memakai write/rename tanpa fsync eksplisit; recovery process-interruption bukan jaminan power-loss durability. Target symlink/hard-link tertentu ditolak, bukan didukung transparan.

## L6 — Data legacy tidak digabung otomatis

`productDataPath()` memilih path `.kuro` yang ada, lalu legacy `.ruko`, lalu lokasi default yang aktif. Bila kedua path berisi data, hanya path yang dipilih yang dibaca; tidak ada merge config/transkrip/skills. Tidak ada migrasi destruktif otomatis. Pengguna harus backup dan memindahkan data secara sadar bila menginginkan konsolidasi.

## L7 — Surface immutable dan subsistem verifikasi terbatas

`SECURITY_CORE_FILES` melindungi enam path historis, bukan setiap modul keamanan baru. `TieredGate`/compiler guards diuji sebagai subsistem; keberadaannya tidak membuktikan setiap mutasi agent menjalankan typecheck otomatis. Nilai keberhasilan tool tidak setara keberhasilan build/aplikasi. Reviewer wajib menjalankan checks nyata.

## L8 — Model dan source inspection terbatas

Project/web/memory/skills ditandai sebagai konteks tidak tepercaya, tetapi model dapat tetap terpengaruh. Repo map hanya JS/TS yang terbatas inventaris/ukuran, melewati symlink dan root data; bukan peta bahasa lengkap atau audit compiler. Search menggunakan backend rg dan fallback matcher; dokumentasi tidak menjamin identitas seluruh dialect regex.

## L9 — Pengaturan remote dan release

Workflow CI/CodeQL/Dependabot dalam source bukan bukti Secret Scanning, Push Protection, Branch Protection, ataupun CodeQL deployment telah aktif. Versi source `1.0.0` bukan klaim tag/release sudah diterbitkan. Hasil remote harus diperiksa terpisah; installer branch mutable memerlukan opt-in atau pin commit.

## L10 — Workspace di dalam direktori data privat

Guard menilai path absolut maupun relatif dan memperlakukan ancestor `.kuro`/`.ruko` sebagai boundary privat. Workspace biasa yang ditempatkan di bawah direktori data product dapat ikut ditolak (overblocking); letakkan source proyek di luar root data privat. Jangan menghapus pemeriksaan absolut secara umum untuk menghindari kasus ini, karena file data privat di luar cwd juga harus dilindungi.

Batas berisiko operasional terbuka dicatat di [FINDINGS.md](FINDINGS.md); mitigasi tidak boleh dijual sebagai fix lengkap tanpa evidence baru.
