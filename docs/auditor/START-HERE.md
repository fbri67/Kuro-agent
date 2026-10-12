# Mulai audit di sini

Audit dibatasi pada kebijakan aplikasi lokal, bukan jaminan isolasi OS. Jangan membaca semua kode sekaligus atau menjadikan output bot historis sebagai bukti.

## Urutan baca

1. [THREAT-MODEL.md](THREAT-MODEL.md): aset, trust boundary, dan non-goals.
2. [KNOWN-LIMITS.md](KNOWN-LIMITS.md): batas yang sudah diterima serta gap yang belum diklaim selesai.
3. [FINDINGS.md](FINDINGS.md): status berbasis source/test; bedakan fixed, open, dan perlu verifikasi.
4. [Peta arsitektur](../contributor/ARCHITECTURE.md): ikuti satu jalur entry → gate → effect.
5. [SECURITY-RULES.md](../contributor/SECURITY-RULES.md): invariants reviewer.

## Jalur audit terbatas

| Fokus | Source awal | Test bukti awal |
| --- | --- | --- |
| PLAN/ACT dan scope | `securityPipeline.ts`, `dispatcher/dispatcherGate.ts`, `approval/scopeAmendment.ts` di `src/core/` | `fase2_dispatcherGate`, `approval_binding`, `fase3_scopeAmendment_symlink`, `plan_lifecycle` |
| Lock/state | `src/core/state/fileLock.ts`, `hostState.ts` | `fase1_fileLock`, `fase1_hostState`, `lock_concurrency` |
| I/O privat dan legacy storage | `src/core/productPaths.ts`, `src/agent/tools.ts`, `filetools.ts`, `src/core/undo.ts` | `product_migration_security`, `product_migration_data`, `sensitive_protection`, `secureRead` |
| Shell/background | `src/core/approval.ts`, `executor.ts`, `approval/sessionAllowlist.ts`, `src/agent/processManager.ts` | `approval.test.js`, `executor.test.js`, `process_manager`, `sessionAllowlist`, `dotenv_poisoning` |
| Rollback/delegasi | `src/agent/agent.ts`, `subagent.ts`, `src/core/mutationCheckpoint.ts` | `agent.test.js`, `mutation_checkpoint`, `subagent_scope_inheritance` |
| Jaringan | `src/agent/webtools.ts`, `src/core/network/hostFetch.ts` | `sensitive_protection`, `fase1_hostFetch` |

Nama test di tabel adalah substring filter runner, bukan lokasi baru. Untuk memulai, `npm ci`, `npm run build`, lalu `node scripts/run-tests.mjs --filter <substring>`.

## Pelaporan

Satu finding memuat: boundary/invariant, evidence path:line atau nama test, dampak, cakupan/precondition, status, dan langkah remediasi/acceptance. Reproduksi hanya pada fixture lokal; jangan mengirim kredensial atau melakukan tes terhadap pihak ketiga. Untuk risiko yang belum dipatch, gunakan laporan privat di [Security Policy](../../.github/SECURITY.md).

`docs/internal/` hanya checkpoint kerja/QA maintainer. Onboarding audit tidak bergantung padanya. Suite green bukan bukti tidak ada kerentanan; CI/CodeQL/setting repo harus diperiksa dari hasil aktual.
