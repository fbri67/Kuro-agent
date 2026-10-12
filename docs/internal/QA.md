# QA internal — continuation Kuro

Hasil eksekusi nyata pada 2026-10-12. Bukan klaim audit lengkap atau status GitHub security settings.

## Lingkungan dan cakupan

- Source: workspace Ruko branch `feat/rich-architecture-upgrade`, baseline upstream `b6703af`.
- Host Linux; Node `v24.21.0`, npm `11.19.0`. Uji kompatibilitas tambahan memakai Node `v18.20.8` via `npm exec --package=node@18.20.8`.
- Verification persistence penuh terakhir memakai HOME sementara untuk menghindari ketergantungan data/trust pengguna.
- Inventaris: 124 berkas test source dan 124 compiled; tidak ada compiled test stale.

## Hasil final source

| Pemeriksaan | Hasil aktual |
| --- | --- |
| `npm run typecheck` | Exit 0 |
| `npm test`, Node 24.21.0 | 124 berkas, 69 suite, 1.414 test; 1.413 pass, 0 fail/cancelled, 1 skip |
| `node scripts/run-tests.mjs`, Node 18.20.8 | 124 berkas, 69 suite, 1.414 test; 1.413 pass, 0 fail/cancelled, 1 skip |
| `npm run test:e2e` | 1 pass, 0 fail |
| `npm run test:urls` | 7 test, 6 pass, 0 fail, 1 skip |
| `npm run build` | Exit 0 |
| `npm audit --omit=dev` | 0 vulnerabilities menurut audit npm |
| `npm ls --omit=dev --depth=0` | `@babel/parser@7.29.9`, `@vscode/ripgrep@1.18.0`, `diff@8.0.3` |
| `node dist/index.js --version` | `kuro v1.0.0` |
| PTY CLI, HOME/workspace fixture | `/map` menampilkan `sample.ts` dan `localSmoke`; `/scope status` menampilkan `Mode: PLAN`, `Scope: (none)`; `/exit` exit 0; state host PLAN |
| `bash -n install.sh` | Exit 0; syntax saja, bukan instalasi global live |
| `git diff --check` | Exit 0 |

Skip berasal dari regresi drive-letter/UNC khusus Windows pada Linux. Windows/macOS belum dieksekusi lokal; CI remote perlu diperiksa terpisah.

## Red-to-green dan compatibility

- `product_migration_security.test.ts`: 4 regresi gagal sebelum perbaikan root/exception bersarang, kemudian keenam test lulus.
- Prefix child Kuro/Ruko: tes foreground gagal karena fixture nilai diteruskan, lulus setelah sanitizer. Background memakai environment fixture tanpa secret asli; regresi lulus setelah sanitizer yang sama.
- Root storage symlink: kedua test `.kuro`/`.ruko` gagal sebelum `dataRootExists`, kemudian lulus.
- `product_migration_data.test.ts`: config/history/memory/session/skills/undo/checkpoint, coexistence legacy, dan global trust benar-benar dibaca/ditulis pada fixture; 4 test lulus.
- Dua regresi mixed-root tambahan menegaskan tidak ada merge otomatis dan path baru memakai root aktif.
- Test baru background awalnya cancelled pada Node 18 akibat child unref; ref/timeout hanya di fixture mengatasi pembatalan, seluruh suite Node 18 kemudian lulus.
- Guard metadata lockfile ditemukan masih membawa nama/biner Ruko. Assertion manifest vs lockfile gagal dahulu, lalu lulus setelah `name`/root `name` menjadi `kuro-agent` dan `bin` menjadi `kuro`; versi/integrity dependency tidak diubah.

## Review independen

Dua review subprocess Hermes terpisah dilakukan read-only dengan scope terbatas, bukan seluruh source. Review pertama menandai storage symlink (ditutup dengan regresi/fix), inherited provider environment, dan mixed-root selection (limit/kebijakan dijelaskan, bukan janji enkripsi atau merge otomatis). Review follow-up mengonfirmasi kontrak perubahan dalam scope; mencatat potensi overblocking workspace di bawah ancestor data privat. Verdict JSON follow-up memiliki `passed: true` tetapi memuat catatan non-blocking dalam array `logic_errors`; karena schema tidak konsisten, verdict itu tidak diperlakukan sebagai approval formal bersih. Batas tersebut dicatat di KNOWN-LIMITS, dan verifikasi source/tool tetap menjadi bukti utama.

## Publikasi

Publikasi memakai clone tujuan terpisah `/workspaces/Kuro-agent`, source current dirty/untracked yang diizinkan disalin tanpa `.git` upstream, dependency/build, `.env*`, credential config, feedback, atau data runtime. Root LICENSE upstream dipertahankan. Repo tujuan telah dibaca dengan `gh repo view` dan terbukti kosong serta milik `fbri67/Kuro-agent` sebelum persiapan.

Salinan publikasi telah menjalankan `npm ci`, typecheck dan full suite (1.414 test / 1.413 pass / 0 fail / 1 skip), E2E, file URL, audit npm, dan PTY CLI. Pemeriksaan tautan lokal Markdown mencakup 73 target/anchor dan lulus. Perubahan metadata lockfile diverifikasi lewat guard terfokus sebelum salinan final diselaraskan kembali.

Metadata final kemudian diuji ulang pada salinan publikasi dengan `npm ci`, typecheck dan seluruh suite: hasil tetap 1.414 test / 1.413 pass / 0 fail/cancelled / 1 skip. Snapshot publikasi berisi 218 file; hash setiap file disamakan dengan source yang dipilih.

Gitleaks `8.30.1` (binary diunduh dari release upstream, SHA256 cocok checksum) memindai staged snapshot saja dengan redaction 100%. Ada 6 kecocokan `generic-api-key`, ditinjau pada fixture dummy: `fase1_redactionStream.test.ts:69`, `persistence_scope.test.ts:59`, `providers.test.ts:76`, `setup_provider.test.ts:63`, `config.test.ts:265` dan `:267`. Tidak ditambahkan allowlist menyeluruh dan tidak mengklaim scanner menjamin ketiadaan secret arbitrer. Report redacted tersimpan lokal, bukan dipush.

`git diff --check` pada perubahan source lulus. Pemeriksaan initial import tujuan (`git diff --cached --check` karena semua file baru) menampilkan 67 warning whitespace/blank EOF yang sudah ada pada source yang diimpor. Tidak dilakukan reformat massal atas file historis untuk menghilangkannya; warning ini tidak disamakan dengan defect runtime atau dinyatakan clean.

Catatan ini merekam verifikasi lokal sebelum initial push. Keberhasilan push/commit remote harus dibuktikan dengan read-back SHA/branch terpisah; tidak ada tag/release yang diminta. Tidak mengklaim CI remote green hanya karena checks lokal green.

## Risiko yang masih ada

Lihat `docs/auditor/FINDINGS.md` dan `KNOWN-LIMITS.md`: workspace concurrency checkpoint, power-loss durability, cakupan lock semua pemanggil host-state, environment non-product/provider, TOCTOU dan batas policy aplikasi. Tidak menjalankan eksploit atau pengujian target pihak ketiga.
