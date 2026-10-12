# Kuro — AI Coding Agent CLI

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-%3E%3D5.5-blue.svg)](package.json)
[![Dependencies](https://img.shields.io/badge/runtime%20dependencies-3-orange.svg)](package.json)
[![Tests](https://img.shields.io/badge/tests-npm%20test-blue.svg)](src/tests/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![CI](https://img.shields.io/badge/CI-Linux%20%7C%20Windows%20%7C%20macOS-blue.svg)](.github/workflows/ci.yml)
[![Security](https://img.shields.io/badge/security-workflows%20documented-blue.svg)](.github/SECURITY.md)

**Kuro** adalah AI Coding Agent CLI yang cepat, minimalis, dan *security-hardened*. Dibangun di atas **Node.js (ESM) + TypeScript** dengan tiga paket runtime yang di-allowlist secara eksplisit, Kuro menghadirkan pair-programming langsung dari terminal.

Kuro-agent adalah fork/turunan dari [Iky969/Ruko-agent](https://github.com/Iky969/Ruko-agent). Hak cipta kode upstream tetap **Copyright (c) 2026 Ruko**, sebagaimana tercantum dalam [LICENSE](LICENSE). Nama Kuro membedakan fork ini, bukan memindahkan kepemilikan kode Ruko atau mengganti lisensi upstream. Kontributor manusia dan AI tercantum di [CONTRIBUTORS.md](CONTRIBUTORS.md).

### Install Cepat (macOS / Linux / WSL / Termux)

```bash
KURO_ALLOW_MUTABLE=1 bash -c "$(curl -fsSL https://raw.githubusercontent.com/fbri67/Kuro-agent/main/install.sh)"
cd /proyek-anda
kuro
```

> Tag rilis immutable belum tersedia; `KURO_ALLOW_MUTABLE=1` secara eksplisit mengizinkan penggunaan branch `main` sementara. Kuro menerima variabel `RUKO_*` serta data lama `.ruko/` untuk kompatibilitas. Windows & Jupyter/Colab: lihat bagian [Instalasi per Platform](#-instalasi--memulai-cepat).

---

## 📑 Daftar Isi

- [Sorotan](#-sorotan-utama)
- [Instalasi](#-instalasi--memulai-cepat)
- [Keamanan](#-arsitektur-keamanan)
- [Fitur](#-fitur-unggulan)
- [Tools](#-daftar-tool-terintegrasi)
- [Slash Commands](#-daftar-perintah-slash)
- [Konfigurasi](#-konfigurasi--profil)
- [Pengujian](#-pengujian--verifikasi)
- [Troubleshooting](#-troubleshooting)
- [Struktur](#-struktur-modul)
- [Lisensi](#-lisensi)

---

## 🌟 Sorotan Utama

- 🛡️ **Dual-Layer Approval Gate**: Regex instant (Layer 1) + Guardian LLM semantic (Layer 2) + audit log `.kuro/guardian-audit.log`
- 🤝 **Workspace Trust**: Konfirmasi folder pada terminal interaktif; sumber izin adalah global trust store di HOME. Marker `.kuro/trusted`/`.ruko/trusted` dalam repo bukan otorisasi.
- 📦 **Runtime Dependencies Terbatas**: `@babel/parser`, `@vscode/ripgrep`, dan `diff` di-allowlist eksplisit serta dijaga oleh `runtime_dependency_guard.test.ts`
- 🔍 **Smart Code Tools**: `glob`, `code_search`, `read_file` paginated, `edit_file` dengan diff LCS, `patch_file` hemat token
- ⏪ **Snapshot Undo**: Backup otomatis ke `.kuro/undo/` (mode 0600), rollback via `/undo`
- 🎮 **Modern TUI**: Status box responsif (aman di Termux 40 cols), action log `├── `, live bottom tray, ambient input, Pac-Man thinking ticker
- 🔑 **Multi-Provider**: OpenAI, OpenRouter, DeepSeek, Groq, Together, Ollama, LM Studio, vLLM — kredensial mode 0600
- 🔒 **Security Automation**: workflow CI multi-OS dan CodeQL serta konfigurasi Dependabot — status fitur GitHub repo dijelaskan terpisah di [.github/SECURITY.md](.github/SECURITY.md)

---

## 🚀 Instalasi & Memulai Cepat

**Kebutuhan**: Node.js >=18 — Linux, macOS, WSL, Termux Android, Windows, serta Jupyter Notebook / Google Colab.

### 1. macOS / Linux (termasuk WSL & Termux) — curl

```bash
KURO_ALLOW_MUTABLE=1 bash -c "$(curl -fsSL https://raw.githubusercontent.com/fbri67/Kuro-agent/main/install.sh)"
cd /proyek-anda
kuro
```

Opsi lanjutan (supply-chain strict mode):

```bash
# Tag versi lain
KURO_VERSION=<tag> bash -c "$(curl -fsSL https://raw.githubusercontent.com/fbri67/Kuro-agent/main/install.sh)"
# Pin commit SHA spesifik
KURO_COMMIT_SHA=<sha> bash -c "$(curl -fsSL https://raw.githubusercontent.com/fbri67/Kuro-agent/main/install.sh)"
```

> Installer otomatis mengenali Termux (memperbaiki izin biner `$PREFIX/bin/kuro`) dan WSL.

### 2. Windows

Butuh Node.js >= 18 dan Git. Jalankan di PowerShell:

```powershell
git clone https://github.com/fbri67/Kuro-agent.git
cd Kuro-agent
npm install
npm run build
npm install -g .
kuro
```

Alternatif: jalankan installer curl di atas melalui **WSL** atau **Git Bash**. Kuro mendeteksi shell Windows (cmd/PowerShell) dari `envProfile.shellFamily` — saat memanggil `powershell.exe` digunakan flag process-scoped `-NoProfile -NonInteractive -ExecutionPolicy Bypass` (execution policy sistem tidak diubah).

### 3. Jupyter Notebook / Google Colab

Di cell notebook:

```python
!git clone https://github.com/fbri67/Kuro-agent.git
%cd Kuro-agent
!npm install && npm run build && npm install -g .
```

Lalu jalankan (Colab: `%cd /content` dulu):

```python
!kuro --exec "jelaskan isi folder ini"
```

Catatan lingkungan notebook:
- Flavor `colab`/`jupyter` terdeteksi otomatis dari env var resmi (`COLAB_GPU`, `COLAB_RELEASE_TAG`, `DATALAB_ENV`, `JPY_PARENT_PID`, `JPY_SESSION_NAME`) dan tampil di banner/status bar.
- Tanpa TTY interaktif, splash menampilkan satu baris teks polos dan prompt approval otomatis **menolak** aksi berisiko (gunakan `RUKO_YOLO_MODE=1` + `RUKO_TRUST_FOLDER=1` dengan hati-hati).

### 4. Build Lokal (semua platform)

```bash
git clone https://github.com/fbri67/Kuro-agent.git
cd Kuro-agent
npm install
npm run build
npm install -g .   # atau untuk dev: npm link
```

Lalu di proyek mana pun:

```bash
cd /jalur/proyek-anda
kuro
```

Data baru memakai `./.kuro/` dan `~/.kuro/`. Berkas atau subdirektori `.ruko/` lama tetap dipakai bila path Kuro yang sesuai belum ada, sehingga data lama tidak dipindah atau ditimpa otomatis. Bila kedua path sudah ada, `.kuro` menang; path baru mengikuti root aktif. Tidak ada merge otomatis. Root data bersymlink/non-direktori ditolak.

### 5. Workspace Trust

Saat pertama kali di folder baru:

```
[Keamanan Workspace Kuro]
Folder aktif: /path/to/project
Apakah kamu mempercayai folder ini? (y/n):
```

Gunakan `--trust-folder` atau `RUKO_TRUST_FOLDER=1` untuk CI.

### 6. Wizard Konfigurasi

Jika tanpa kredensial, Kuro memandu:

1. **API Key** (input disamarkan `*`)
2. **Base URL** (`https://api.openai.com/v1`, `http://localhost:11434/v1`, dll.)
   - HTTP butuh konfirmasi eksplisit `y/n` untuk cegah cleartext leak
3. **Model Name** (`gpt-4o`, `deepseek-chat`, `qwen2.5-coder`, dll.)
4. Tes koneksi langsung — simpan ke `.kuro/config.json` mode 600

---

## 🛡️ Arsitektur Keamanan

Kuro menerapkan defense-in-depth:

```
[ Shell / Tool Exec ]
        ↓
[ Layer 1: Regex Risk Detector ]
  NONE → langsung | BLOCKED → tolak mutlak | DANGEROUS → Layer 2
        ↓
[ Layer 2: Guardian LLM (isolated, temp 0) ]
  SAFE → ✓ Guardian: aman | BLOCKED → tolak | DANGEROUS → konfirmasi y/N
        ↓
[ Audit Log .kuro/guardian-audit.log (0600) ]
```

**Proteksi Inti**:

1. **Workspace Sandbox**: `assertInsideWorkspace()` blokir `../../etc/passwd`, `~/.ssh`, symlink traversal
2. **Regex Gate**: Ratusan pola destruktif (`rm -rf /`, `mkfs`, `dd`, `find -delete`, `truncate`, `shred`, chain `&& ; ||`)
3. **Guardian LLM**: Analisis semantik untuk `DANGEROUS`, auto-allow jika aman (contoh `python3 -c "print(1+1)"`)
4. **Kredensial**: Blokir akses `.kuro/config.json`, `.env`, `id_rsa`, `*.pem`, `*.key` di semua tools + `exec` wildcard `cat .kuro/*`
5. **Env Dump Prevention**: Blokir `printenv`, `env`, `export -p`, `node -e process.env`, `$API_KEY` expansion
6. **Shell Sanitization**: Bersihkan `BASH_FUNC_*`, `BASH_ENV`, `ENV`, `PROMPT_COMMAND`, `CDPATH`
7. **SSRF Protection**: Native IP-pinning transport, blokir private IP, IPv4-mapped IPv6, desimal/oktal/hex notation, redirect hop validation
8. **Security Automation**: workflow CI multi-OS dan CodeQL ada di repo, begitu pula konfigurasi Dependabot. Secret Scanning, Push Protection, dan Branch Protection adalah pengaturan GitHub repo yang perlu diverifikasi maintainer; lihat [.github/SECURITY.md](.github/SECURITY.md).

> Detail batasan & kebijakan: lihat [SECURITY.md](.github/SECURITY.md) dan bagian Security Boundaries di bawah.

---

## 💡 Fitur Unggulan

### Peta Repositori & Pemulihan Mutasi
- `/map [path]` membangun ringkasan AST simbol dan relasi import lokal JavaScript/TypeScript; melewati direktori dependency/build dan file sensitif, dengan batas ukuran.
- Tool `repo_map` menyediakan peta yang sama untuk agen.
- Checkpoint transaksi menyimpan salinan aman sebelum mutasi tool; bila langkah dalam satu giliran gagal, perubahan yang sudah tercatat dapat dipulihkan. Perubahan shell langsung ke workspace diblokir saat checkpoint aktif.

### Eksplorasi Kode
- `glob`: multi-pattern + brace `{a,b}`, ignore `node_modules/.git/dist/.kuro`
- `code_search`: keyword/regex + konteks baris, support filter extension array
- `web_fetch`: fetch publik 10s timeout, sanitasi HTML, max 5k chars, IP-pinning

### Modifikasi Aman
- `edit_file`/`write_file`: diff visual `+` hijau `-` merah
- `patch_file`: search-replace hemat token
- `delete_file`/`move_file`: konfirmasi `[Y/N]` + snapshot undo
- `/undo [path]`: rollback file spesifik atau global

### Efisiensi
- **Log Summarizer**: output >1000 char dipotong proporsional 40% head + 60% tail, highlight error
- **Context Compression**: rangkum percakapan lama saat mendekati limit, adjustable via `/setctx`, `/settoken`, `/context set`
- **Multi-Profil**: `.kuro/config.json` dengan alias `hemat`, `kuat`, `lokal` — ganti via `/profile`

### Plan Mode & Reasoning
- **`/plan on`**: agent hanya baca & usulkan langkah; write/exec diblok di kode
- Saat model menampilkan menu bernomor (`1. … / 2. …`), balas dengan nomor (atau `pilih 1`, `opsi 2`) → Plan Mode **otomatis off** dan opsi dieksekusi (tanpa `/plan off` manual)
- **`/plan off` / pilihan rencana bernomor**: transisi ke ACT menyimpan kontrak scope default `.` (workspace) jika scope belum ada. Scope yang sudah disetujui tidak diperluas otomatis. Berlaku juga pada input non-TTY yang secara eksplisit meminta ACT; startup/resume tetap PLAN.
- **`/scope allow <path>`**: setujui file/subtree di dalam workspace, termasuk path baru yang belum dibuat. Untuk scope sempit, jalankan `/scope allow src` saat PLAN sebelum `/plan off`. Perintah ini tidak mengubah Plan Mode; izin ditambahkan, bukan mengganti scope yang sudah ada.
- **`/scope status`** (atau `/scope`): lihat mode dan path yang disetujui. **`/scope reset`** mencabut seluruh kontrak path; setelah reset, mutasi file ditolak sampai izin eksplisit baru diberikan. Reset lalu allow path sempit jika sebelumnya scope mencakup `.`.
- `/plan on` dan resume sesi ACT membatalkan scope. Scope/YOLO tidak melewati pembatasan workspace, symlink escape, path sensitif, atau security core.
- **`/reasoning low|medium|high`**: atur tingkat reasoning native (default `medium`); level lama `xhigh`/`max`/`extreme` sudah diseragamkan

---

## 🛠️ Daftar Tool Terintegrasi

<details>
<summary>Klik untuk melihat 24 tools lengkap</summary>

| Tool | Kategori | Deskripsi |
| :--- | :---: | :--- |
| `exec` | Eksekusi | Shell via approval gate 2 lapis, default 120s, support `timeoutMs` |
| `glob` | Inspeksi | Cari berkas multi-pattern, ignore build & biner |
| `list_dir` | Inspeksi | List isi direktori 1-level + ukuran B/KB/MB |
| `code_search` | Inspeksi | Cari keyword/regex + konteks |
| `read_file` | Baca | Paginated offset/limit + line numbers, binary-aware |
| `write_file` | Tulis | Buat file baru dalam workspace |
| `edit_file` | Tulis | Timpa file + diff visual |
| `patch_file` | Tulis | Search-replace presisi |
| `delete_file` | Manipulasi | Hapus aman + konfirmasi + undo |
| `move_file` | Manipulasi | Pindah/rename + konfirmasi + undo |
| `revert_file` | Manipulasi | Rollback snapshot `.kuro/undo/` atau `git checkout` |
| `web_fetch` | Jaringan | Fetch publik + SSRF IP-pinning |
| `remember` | Memori | Simpan fakta ke `.kuro/memory.md` lintas sesi |
| `search_sessions` | Pencarian | Cari lintas sesi (limit 5, snippet 150 char) |
| `load_skill` | Skill | Muat skill dari `.kuro/skills/` |
| `save_skill` | Skill | Simpan workflow sukses sebagai skill reusable |
| `delete_skill` | Skill | Hapus skill usang + preview + konfirmasi |
| `list_skills` | Skill | List nama & deskripsi skill |
| `delegate` | Delegasi | Subagent isolated, sekuensial 1 tool/turn (bukan concurrent/paralel), timeout 60s |
| `start_process` | Proses | Non-blocking background (max 3 aktif) |
| `read_process_logs` | Proses | Ring buffer 100 baris + redaksi kredensial |
| `get_status` | Proses | Status deterministik `running/exited/stale` |
| `stop_process` | Proses | Stop bertahap SIGTERM→SIGKILL |

</details>

---

## ⌨️ Daftar Perintah Slash

<details>
<summary>Klik untuk melihat 24+ slash commands</summary>

| Perintah | Fungsi |
| :--- | :--- |
| `/help` / `/?` | Panduan bantuan chip/badge highlight |
| `/exit` | Keluar (sesi auto-simpan) |
| `/login` | Wizard provider + tes koneksi |
| `/new` | Sesi baru (sesi lama tersimpan) |
| `/sessions` | List sesi tersimpan |
| `/search <kw>` | Cari lintas sesi + `/resume` |
| `/resume <id>` | Lanjut sesi |
| `/export [json\|md]` | Ekspor trajectory |
| `/clear` | Bersihkan memori percakapan |
| `/compact` | Paksa kompresi history |
| `/plan on\|off` | Mode rencana (blokir write/exec); balas nomor opsi → auto-off + eksekusi |
| `/scope [allow <path>\|status\|reset]` | Setujui path mutasi, lihat kontrak, atau cabut seluruh scope sesi |
| `/mode [default\|research\|code\|build]` | Mode operasional agen (AgentMode: `default`\|`research`\|`code`\|`build`) |
| `/reasoning [low\|medium\|high]` | Tingkat reasoning native (default medium) |
| `/yolo on\|off` | Mode auto-approve |
| `/undo [path]` | Batalkan perubahan file |
| `/settings` | Dashboard terpadu (context, tokens, role, mode, approval) |
| `/role [nama]` | Ganti role AI |
| `/settings mode [beginner\|pro]` | Mode tampilan antarmuka (UiMode: `beginner`\|`pro`) |
| `/profile [alias]` | Ganti profil LLM |
| `/exec <cmd>` | Shell langsung |
| `/history [n]` | n pesan terakhir |
| `/context [set <n>]` | Kapasitas memori / set limit |
| `/ctx` | Dashboard context budget |
| `/memory [clear]` | Lihat/reset persistent memory |
| `/usage` | Statistik token & waktu kerja agen |
| `/config [set <k> <v>\|setup]` | Lihat/update konfigurasi |
| `/model [nama]` | List/ganti model aktif |

</details>

---

## ⚙️ Konfigurasi & Profil

Config di `./.kuro/config.json` mode `0o600`:

```json
{
  "mode": "beginner",
  "defaultProfile": "utama",
  "profiles": {
    "utama": { "baseUrl": "https://api.openai.com/v1", "model": "gpt-4o", "apiKeyEnv": "OPENAI_API_KEY" },
    "lokal": { "baseUrl": "http://localhost:11434/v1", "model": "qwen2.5-coder" }
  },
  "guardianEnabled": true,
  "guardianTimeoutMs": 5000
}
```

**Env Vars**:

| Variabel | Deskripsi |
| :--- | :--- |
| `OPENAI_API_KEY` | API key default |
| `OPENAI_BASE_URL` | Endpoint OpenAI-compatible |
| `AGENT_MODEL` | Nama model |
| `KURO_API_KEY` | API key default (`RUKO_API_KEY` tetap diterima sebagai alias) |
| `KURO_CONFIG` | Path config kustom (`RUKO_CONFIG` tetap diterima sebagai alias) |
| `KURO_UNDO_DIR` | Path snapshot undo (`RUKO_UNDO_DIR` tetap diterima sebagai alias) |
| `KURO_YOLO_MODE=1` | Skip konfirmasi dangerous (blocked tetap aktif; alias `RUKO_YOLO_MODE`) |
| `KURO_TRUST_FOLDER=1` | Auto-trust workspace (alias `RUKO_TRUST_FOLDER`) |
| `NO_COLOR=1` | Nonaktifkan ANSI |

---

## 🧪 Pengujian & Verifikasi

```bash
npm run typecheck   # static type check
npm test            # jumlah test aktual ditampilkan oleh runner
npm run test:e2e    # E2E test
```

Test mencakup: approval regex & Guardian adversarial, multi-format tool parser (markdown fence, DSML, XML), Immutable Security Core, sandbox traversal, SSRF + IP-pinning, SSE multi-provider, TUI rewinding, context compression, undo journal, memory/skills/delegation.

---

## 🛡️ Security Boundaries & Known Limitations

1. **Approval Gate bergantung user**: Persetujuan `Y`/YOLO dapat mengizinkan kode berbahaya yang tidak dikenali; PLAN, BLOCKED, scope, dan guard path tetap berlaku pada jalurnya. Ini bukan sandbox OS.
2. **Redaksi kredensial best-effort**: Regex heuristik, bukan jaminan 100% anti-leak token arbitrer
3. **TOCTOU filesystem**: Micro-window antara `lstat`/`realpath` dan I/O kernel jika proses eksternal swap symlink
4. **Single-user trusted env**: Untuk multi-user/server publik, jalankan di Docker/VM non-root + egress filtering
5. **Prompt injection via read-only**: `web_fetch` atau file pihak ketiga bisa berisi instruksi terselubung — model tetap rentan terpengaruh analisis
6. **Memory & skills writable by design**: `.kuro/memory.md` & `.kuro/skills/` bisa ditulis agen — monitor via `/memory`
7. **Rekomendasi isolasi**: Untuk repo tak tepercaya/CI, gunakan container terisolasi
8. **API key plaintext awareness**: `apiKey` di config plaintext + 0600, warning jika env var tidak aktif. Rekomendasi: simpan di env var (`KURO_API_KEY` atau provider key) dan kosongkan field `apiKey`. Enkripsi at-rest tidak diimplementasikan (butuh key management terpisah)

Threat model, batas checkpoint/concurrency/environment, dan status temuan berbasis bukti ada di [docs/auditor/START-HERE.md](docs/auditor/START-HERE.md). Jangan menyimpulkan isolasi kernel atau jaminan tidak ada kebocoran dari daftar guard di atas.

---

## 📂 Struktur Modul

```
src/
├── index.ts              # CLI entry & arg routing
├── types.ts              # Interface & config schema
├── agent/
│   ├── agent.ts          # Orchestrator & tool loop + anti-loop tri-layer
│   ├── commands.ts       # Slash command registry
│   ├── filetools.ts      # glob, code_search, read_file, list_dir (sandboxed)
│   ├── llm.ts            # Multi-provider client & streaming parser
│   ├── roles.ts          # System prompt & roles
│   ├── subagent.ts       # Delegation isolated
│   ├── tools.ts          # Tool call protocol & security guards
│   └── webtools.ts       # web_fetch + SSRF IP-pinning
└── core/
    ├── approval.ts       # Dual-layer gate & Guardian LLM
    ├── compressor.ts     # Adaptive conversation compression
    ├── config.ts         # Config loader & sanitization
    ├── context.ts        # Context window management
    ├── diff.ts           # Git-style diff visualizer
    ├── dotenv.ts         # Zero-dep .env parser
    ├── executor.ts       # Safe shell execution
    ├── history.ts        # REPL history .kuro/history
    ├── loop.ts           # Interactive loop & TUI controller
    ├── memory.ts         # Persistent memory .kuro/memory.md
    ├── session.ts        # Session storage .kuro/sessions/
    ├── skills.ts         # Modular skills .kuro/skills/
    ├── splash.ts         # Banner & status
    ├── summarizer.ts     # Long log summarizer
    ├── tui.ts            # Raw-mode engine & live overlay
    ├── ui.ts             # ANSI formatting, box, Pac-Man animation
    └── undo.ts           # File snapshot journal
```

---

## 🔧 Troubleshooting

### Termux / Android — Permission Denied

```bash
chmod +x $PREFIX/bin/kuro
```

### Terminal Raw Mode Pasca-Crash / SIGKILL

Jika proses di-`kill -9` dan terminal tidak responsif (echo mati, karakter tak muncul):

```bash
reset          # opsi 1: reset penuh (disarankan)
stty sane      # opsi 2: kembalikan sane mode
tput cnorm     # opsi 3: jika kursor hilang
```

Kuro sudah punya `emergencyCleanup()` untuk kembalikan raw mode, tapi SIGKILL di level kernel tidak bisa di-trap — gunakan command di atas.

### Layar Sempit (Termux 40 cols)

- Status bar otomatis prioritas `ctx %` + badge penting, nama model dipotong proporsional
- Set `COLUMNS=40` untuk simulasi testing
- Gunakan `/ctx` untuk cek context budget jika terpotong

---

## 📄 Lisensi

Kode proyek tetap menggunakan **MIT License** — lihat [LICENSE](LICENSE). Naskah lisensi utama dan **Copyright (c) 2026 Ruko** dipertahankan tanpa perubahan.

MIT mengizinkan penggunaan, modifikasi, dan distribusi, dengan kewajiban mempertahankan pemberitahuan hak cipta serta naskah izin pada salinan atau bagian substansial kode. Fork dan perubahan nama tidak menghapus hak cipta upstream.

Dependency pihak ketiga tetap mengikuti lisensi dan hak cipta masing-masing; lihat [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Notice tersebut tidak mengganti lisensi proyek Ruko.

---

## 🤝 Kontribusi & Keamanan

- **Panduan kontribusi:** [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- **Setup & arsitektur kontributor:** [SETUP](docs/contributor/SETUP.md), [ARCHITECTURE](docs/contributor/ARCHITECTURE.md), [SECURITY-RULES](docs/contributor/SECURITY-RULES.md), [REVIEW](docs/contributor/REVIEW.md)
- **Mulai audit:** [START-HERE](docs/auditor/START-HERE.md), [THREAT-MODEL](docs/auditor/THREAT-MODEL.md), [KNOWN-LIMITS](docs/auditor/KNOWN-LIMITS.md), [FINDINGS](docs/auditor/FINDINGS.md)
- **Kebijakan keamanan**: [.github/SECURITY.md](.github/SECURITY.md) — threat model, panduan pelaporan, workflow keamanan, dan pengaturan yang perlu diverifikasi maintainer
- **Contributors**: [CONTRIBUTORS.md](CONTRIBUTORS.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)

Issue publik **diperbolehkan** (bug, fitur, diskusi). Untuk kerentanan keamanan yang butuh perbaikan lebih cepat dan aman, hubungi privat lewat **GitHub Security Advisory** atau profil maintainer — detail di [SECURITY.md](.github/SECURITY.md).
