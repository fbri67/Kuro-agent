# Security Policy

## Status source

Source Kuro `1.0.0` adalah baseline proyek saudara [Ruko-agent](https://github.com/Iky969/Ruko-agent). Nomor versi ini tidak menyatakan tag/release sudah diterbitkan.

## Melaporkan kerentanan

Issue publik boleh dipakai untuk bug, fitur, dan pertanyaan non-sensitif. Kerentanan yang belum dimitigasi dilaporkan privat melalui GitHub Security Advisory bila tersedia, atau kontak maintainer pada profil GitHub. Jangan memublikasikan kredensial, data sesi, ataupun rantai eksploit sebelum mitigasi dan koordinasi pengungkapan selesai. Kredit reporter diberikan dengan persetujuannya.

Tidak ada SLA respons yang dijamin oleh dokumen ini.

## Boundary yang dijaga

- PLAN menolak mutasi/subprocess di dispatcher, termasuk saat YOLO/`--yes` aktif.
- Scope path berasal dari host/pengguna. Path luar workspace dan symlink escape tidak menjadi sah hanya karena pengguna menyetujui amandemen.
- `.kuro/` dan `.ruko/` sama-sama privat. Tool file umum menolak data selain pengecualian skills/proyeksi plan; memory memakai writer khusus. Root storage bersymlink/non-direktori ditolak.
- Config, transcript, history, undo, trust, dan checkpoint bukan data publik. Berkas owner-only pada POSIX tetap plaintext, bukan enkripsi.
- Shell precheck/approval memblokir pola sensitif/destruktif yang dikenal. Foreground/background berbagi sanitasi prefix `KURO_*`/`RUKO_*` dan startup/loader hooks; environment lain tidak seluruhnya disaring.
- URL tool web diperiksa per hop dengan validasi IP dan transport pinned. Ini bukan egress firewall untuk semua subprocess/provider.
- State host berada di HOME, terpisah dari workspace; lock exclusive/nonce melindungi jalur state yang memilikinya. Resume ACT kembali PLAN dan mencabut scope.

Detail kontrak: [Security Rules](../docs/contributor/SECURITY-RULES.md).

## Kredensial

Jangan memberi key literal melalui argv CLI. Gunakan environment host (`KURO_API_KEY`, alias `RUKO_API_KEY`, atau provider key), `kuro --api-key @/path/to/key.txt`, stdin `kuro --api-key -`, atau wizard pada workspace tepercaya. Jangan menaruh key asli dalam issue, log, fixture, commit, maupun screenshot. Config wizard disimpan owner-only dan dapat memuat key plaintext; warning adalah awareness, bukan enkripsi.

## Threat model dan batasan

Kuro menjalankan aplikasi/child dengan hak akun OS pengguna, bukan sandbox kernel/VM. Approval regex dan Guardian LLM tidak dapat membuktikan keamanan semua script/shell arbitrer. Prompt injection, redaksi token, TOCTOU filesystem, power-loss durability, dan konkurensi checkpoint memiliki batas nyata. Untuk kode asing, gunakan container/VM non-root tanpa mount folder privat, serta pembatasan egress.

Dokumen audit utama:

- [START-HERE](../docs/auditor/START-HERE.md): urutan audit dibatasi.
- [THREAT-MODEL](../docs/auditor/THREAT-MODEL.md): aset, trust boundary, dan non-goals.
- [KNOWN-LIMITS](../docs/auditor/KNOWN-LIMITS.md): batas terdokumentasi, bukan janji keamanan absolut.
- [FINDINGS](../docs/auditor/FINDINGS.md): status dan evidence source/test, bukan ringkasan bot.

## Otomasi dan verifikasi

Source menyediakan CI Linux/Windows/macOS (`.github/workflows/ci.yml`), CodeQL (`codeql.yml`), dan konfigurasi Dependabot. CI menggunakan Node 18.x/20.x serta Node 22.x pada Linux, `npm ci`, typecheck, suite penuh, E2E, dan regresi file URL. Dependency runtime dijaga allowlist di `src/tests/runtime_dependency_guard.test.ts`.

Secret Scanning, Push Protection, Branch Protection, serta keberhasilan CI/CodeQL adalah status remote yang harus diverifikasi maintainer. File workflow tidak membuktikan semua fitur GitHub aktif. CodeQL custom query exclusions bukan bukti ketiadaan risiko pada kategori yang dikecualikan.

```sh
npm run typecheck
npm test
npm run test:e2e
npm run test:urls
npm audit --omit=dev
git diff --check
```

Sebelum merge, periksa checks remote dari commit yang benar dan lihat [Review](../docs/contributor/REVIEW.md). Catatan kerja/QA maintainer berada di `docs/internal/`, tidak menjadi prasyarat onboarding kontributor/auditor.
