# Register temuan

Sumber status adalah source/test yang disebutkan di sini dan output verifikasi aktual, bukan catatan bot atau statistik historis. `fixed` berarti regresi terfokus lulus pada lingkungan yang dicatat; bukan pernyataan tidak ada defect sekelasnya.

| ID | Status | Boundary/temuan | Evidence | Acceptance / tindak lanjut |
| --- | --- | --- | --- | --- |
| MIG-01 | fixed, test lokal lulus | Undo mengizinkan root data privat itu sendiri; pengecualian skills luar dapat membuka root privat bersarang | `src/core/productPaths.ts:isSensitiveProductDataPath`, `src/core/undo.ts:validateSnapshotPath`, `src/agent/tools.ts:isSensitivePath`; `product_migration_security.test.ts` (regresi gagal sebelum fix, lulus setelahnya) | Kedua root `.kuro`/`.ruko` ditolak; skills biasa dan plan tetap tersedia |
| MIG-02 | fixed, test lokal lulus | Variabel internal product diwariskan ke child foreground; background tidak memakai sanitizer yang sama | `src/core/executor.ts:sanitizeChildEnv`, `src/agent/processManager.ts:startProcess`; `executor.test.ts`, `process_manager.test.ts` | Kedua prefix dan hook/loader disaring; variabel aplikasi biasa tetap diwariskan |
| MIG-03 | verified locally | Pemakaian data Ruko lama saat direktori Kuro baru sudah ada | `src/core/productPaths.ts:productDataPath`; `product_migration_data.test.ts`, `product_paths.test.ts`, `env_compat.test.ts` | Config/history/memory/session/skills/undo/checkpoint legacy tetap bekerja tanpa duplikasi; trust tidak berasal dari marker repo |
| MIG-04 | fixed, test lokal lulus | Ekspektasi test lama setelah rename: pesan BLOCKED, root host baru, dan glob root privat | `approval.test.ts`, `e2e_security_pipeline.test.ts`, `sensitive_protection.test.ts` | Perbarui kontrak identitas/lokasi tanpa melemahkan penolakan |
| MIG-05 | fixed, test lokal lulus | Seleksi storage mengikuti root symlink tanpa validasi | `src/core/productPaths.ts:dataRootExists`; `product_paths.test.ts` (regresi kedua root gagal sebelum fix, lulus setelahnya) | Root `.kuro`/`.ruko` yang dipakai harus direktori riil, bukan symbolic link; ini tidak menghapus seluruh race filesystem |
| OPS-01 | open, mitigation documented | Konkurensi checkpoint antar sesi pada workspace yang sama belum dilindungi lock workspace | `src/core/mutationCheckpoint.ts:constructor/ensureActive/recover`; [L4](KNOWN-LIMITS.md#l4--lock-sesi-bukan-lock-workspace-global) | Jangan jalankan sesi mutasi bersamaan; perlu owner/lock workspace dan pengujian recovery/release lintas sesi sebelum mendukungnya |
| OPS-02 | open, durability limit | Journal checkpoint tidak memakai fsync eksplisit | `src/core/mutationCheckpoint.ts:writeAtomic`; [L5](KNOWN-LIMITS.md#l5--rollback-terbatas-dan-durability) | Jangan klaim tahan power loss; perlukan test urutan persist/fsync bila kontrak durability diperluas |
| AUD-01 | review required | Semua pemanggil save state perlu dinilai terhadap cakupan lock/nonce, tidak cukup memeriksa mutator scope | `src/agent/agent.ts:setPlanMode`, `src/core/state/hostState.ts:saveHostState`, `src/core/securityPipeline.ts:stateMutator` | Review transisi mode, perubahan command, dan kepemilikan lock pada commit boundary; status bukan klaim bypass terverifikasi |

## Bukti verifikasi

Regresi terfokus dan suite penuh dilaksanakan pada Linux dengan HOME sementara: Node `v24.21.0` dan `v18.20.8`. Hasil build/audit/smoke serta verifikasi remote disimpan di `docs/internal/QA.md`. Matriks Windows/macOS tetap harus dilihat dari CI yang benar-benar berjalan, tidak disimpulkan dari test Linux.

## Format entri berikutnya

Gunakan ID stabil, status (`open`, `review required`, `fixed`, atau `accepted limit`), invariant, path/simbol atau test, dampak/precondition, evidence aktual, dan acceptance. Temuan sensitif belum dipatch dilaporkan privat sesuai [Security Policy](../../.github/SECURITY.md); register publik cukup menjelaskan mitigasi/batas tanpa payload eksploit.
