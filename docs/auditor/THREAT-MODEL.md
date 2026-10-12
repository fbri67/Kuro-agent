# Threat model

## Produk dan lingkungan yang diasumsikan

Kuro adalah coding agent CLI lokal yang berjalan dengan UID/hak akses pengguna. Targetnya membantu pengguna mengendalikan tindakan model ketika membaca kode/teks pihak ketiga. Ini bukan layanan multi-tenant atau sandbox kernel.

Asumsi operasi: akun OS dan konfigurasi host dipercaya; pengguna meninjau approval; dependency terpasang berasal dari jalur yang dipercaya; kode asing dijalankan dalam container/VM bila memerlukan isolasi kuat. Override `KURO_*`/alias `RUKO_*` dari terminal adalah input host; isi `.env` repo bukan input host.

## Aset

- Integritas source/workspace dan batas subtree yang disetujui.
- Mode PLAN/ACT, kontrak scope/hash, state sesi otoritatif, kepemilikan lock.
- Kredensial provider dan file privat: config, transkrip, history, memory, undo, checkpoint, trust store.
- Hak pengguna untuk menolak shell/background atau akses jaringan berisiko.
- Ketersediaan sesi: output/context/timeout dan batas proses agar agen tidak terus berputar.

## Input tidak tepercaya

Instruksi/hasil LLM, tool args/alias, teks repo/web/memory/skills, project instructions, symlink/path dari repo, dan manifest recovery workspace. Tidak satu pun boleh menjadi sumber izin host hanya karena model menyatakan telah disetujui.

## Boundary dan kontrol

| Boundary | Kontrol | Batas jaminan |
| --- | --- | --- |
| Repo → trust | Global trust store di HOME; marker repo/config trust bukan otorisasi | Akun OS/host sudah dipercaya; trust store bukan enkripsi atau proteksi dari proses same-user |
| Repo `.env` → runtime | Prefix product, startup/loader/proxy/endpoint berbahaya disaring | Bukan allowlist semua environment aplikasi |
| Model → tool | Dispatcher PLAN dan scope; handler path/sensitive/security-core guards | Jalur internal primitive perlu guard dari pemanggil |
| Path → filesystem | Boundary lexical + fisik; validasi symlink/target baru | TOCTOU eksternal belum dijamin atomik pada semua OS |
| Sesi → state host | Lock file exclusive/nonce, state atomic rename, resume ACT → PLAN | Override host tepercaya; lihat cakupan lock di known limits |
| Approval → shell | Detektor risiko/precheck, konfirmasi, grant persis, environment sanitation | Shell/script arbitrary tetap menjalankan hak akun OS |
| Tool → perubahan disk | Snapshot undo dan checkpoint giliran/delegasi | Hanya perubahan tercatat, bukan seluruh workspace/OS/efek jaringan |
| URL → socket | Validasi IP/redirect dan transport pinned | Tidak membatasi semua trafik subprocess atau trafik provider LLM |
| Dependency → runtime | Allowlist manifest/lockfile/import dan audit npm | Allowlist bukan audit menyeluruh binary/supply chain |

`.kuro/` dan `.ruko/` sama-sama privat, bukan dua policy terpisah. `skills` dan proyeksi `plan.json` memiliki pengecualian path; memory menggunakan writer khusus. Data host dan data workspace tidak boleh disamakan.

## Yang tidak dilindungi secara absolut

- Host/akun yang sudah kompromi, root/admin, atau proses same-user yang memodifikasi data di luar agent.
- Eksekusi script package atau shell yang secara eksplisit disetujui, encoding dinamis, semantik shell tak terbatas.
- Enkripsi at-rest, ACL Windows lengkap, backup/container image yang membawa data privat.
- Semua bentuk prompt injection atau kebocoran data; redaksi/wrapping adalah defense-in-depth, bukan boundary model yang sempurna.
- Egress subprocess, side effect remote, rollback semua proses, dan konkurensi lintas sesi workspace.

Rincian/bukti batasan ada di [KNOWN-LIMITS.md](KNOWN-LIMITS.md); status remediasi di [FINDINGS.md](FINDINGS.md).
