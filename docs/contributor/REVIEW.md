# Pull request dan review

## Cakupan PR

1. Buat branch dari `main`; jelaskan masalah dan acceptance criteria sebelum implementasi besar.
2. Untuk bug, tunjukkan test regresi gagal karena bug, lalu lulus setelah perbaikan. Jangan melemahkan assertion keamanan demi green.
3. Ubah hanya area terkait, ikuti style tetangga, dan perbarui dokumentasi/changelog pengguna bila perilakunya berubah.
4. Jangan commit hasil build, `.env*`, data runtime, kredensial, atau log pribadi.
5. Push branch dan buka PR; jangan force-push shared branch atau merge tanpa izin maintainer.

## Pemeriksaan wajib

```sh
npm ci
npm run typecheck
npm test
npm run test:e2e
npm run test:urls
git diff --check
```

`npm test` mencakup build. Tulis versi Node/OS, jumlah berkas/test, status pass/fail/skip, dan alasan skip dari output aktual. Keberadaan workflow tidak berarti CI sudah green; periksa check run remote.

## Tambahan berdasarkan perubahan

Setelah `npm run build`, gunakan `node scripts/run-tests.mjs --filter <substring>`:

| Perubahan | Filter/test yang ditinjau |
| --- | --- |
| Path dan rename storage | `product_migration`, `product_paths`, `sensitive_protection`, `persistence_scope`, `undo_security`, `skills` |
| Mode/scope/alias | `fase2_dispatcherGate`, `fase2_scopeAmendment`, `fase3_scopeAmendment_symlink`, `approval_binding`, `plan_lifecycle` |
| Lock/state | `fase1_fileLock`, `lock_concurrency`, `fase1_hostState`, `security_pipeline_wiring`, `e2e_security_pipeline` |
| Shell/izin sesi | `approval.test.js`, `sessionAllowlist`, `exec_`, `executor.test.js`, `process_manager`, `dotenv_poisoning` |
| Pemulihan/delegasi | `mutation_checkpoint`, `agent.test.js`, `subagent_scope_inheritance` |
| Peta kode/dependency | `repo_map`, `commands.test.js`, `runtime_dependency_guard`; `npm audit --omit=dev` untuk dependency |
| UI/CLI | Test area UI terkait dan smoke interaktif pada PTY; compile saja tidak cukup |

## Checklist reviewer

- Trace definisi, pemanggil, handler, alias efektif dan output akhir, bukan nama simbol saja.
- Pastikan gate berlaku sebelum side effect dan pada kedua sisi move/delegasi.
- Periksa success, error terstruktur, exception, abort, timeout, recovery/resume; assert state disk akhir.
- Untuk kedua root `.kuro`/`.ruko`, uji fresh install, legacy only, dan coexistence. Data legacy tidak boleh hilang karena direktori baru kosong.
- Untuk locks, uji kepemilikan nonce dan release selama write, bukan hanya acquire sukses.
- Validasi dependency/Node floor, output test runner dan source yang benar-benar di-build.
- Tautkan temuan ke file/test konkret di [FINDINGS.md](../auditor/FINDINGS.md); catatan bot tanpa bukti bukan sumber status.

## Template deskripsi PR

Tuliskan: masalah; perubahan; batas cakupan; risiko kompatibilitas; test/regresi red-to-green; hasil verifikasi; isu/batasan yang tersisa. Kerentanan sensitif dilaporkan privat sesuai [Security Policy](../../.github/SECURITY.md), tanpa rantai eksploit di issue publik.
