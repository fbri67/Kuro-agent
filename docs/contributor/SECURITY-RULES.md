# Aturan zona sensitif

Aturan ini adalah kontrak review, bukan izin untuk melewati guard. Reproduksi keamanan hanya pada fixture lokal terisolasi; jangan gunakan kredensial asli atau target pihak ketiga.

## Approval dan mode

- Output LLM/tool args tidak memberi otorisasi. PLAN menolak mutasi dan subprocess secara mekanis, termasuk ketika YOLO/`--yes` aktif.
- Scope disetujui pengguna/host. `approvalScope` kosong atau hash rencana berubah harus menolak mutasi sampai izin baru diberikan.
- Approval sekali atau sesi tidak boleh mengalahkan BLOCKED, containment, path sensitif, atau security core.
- Izin sesi terikat command persis, jenis operasi dan cwd/workspace fisik. Jangan mengubahnya menjadi prefix match atau menyimpan ke repo.
- Evaluasi executable efektif di balik assignment/launcher sebelum menilai reusable grant. Input ambigu harus fail-closed untuk grant berulang.

## Scope dan filesystem

- `path.resolve()`/perbandingan string saja bukan otorisasi fisik. Ikuti segmen symlink sebelum `..`; target baru harus dinilai melalui ancestor yang ada.
- Gate/checkpoint harus memakai alias dan urutan prioritas yang sama dengan handler. `move_file` memeriksa sumber dan tujuan.
- `.kuro/` dan `.ruko/` adalah root data privat. Default-deny, dengan pengecualian path `skills` dan `plan.json`; pengecualian luar tidak boleh membuka root data privat bersarang.
- `.env*`, kunci privat, credential store, git config/hooks dan shell profile tetap dilindungi. Jangan membaca file asli tersebut ketika menulis test.
- Enam path dalam `SECURITY_CORE_FILES` tidak boleh dimutasi melalui tool agen. Daftar itu bukan bukti seluruh modul keamanan immutable; lihat known limits.
- `remember` adalah writer khusus memory; jangan menjadikan pengecualian checkpoint memory sebagai izin tool file umum.
- Config/memory/transkrip dapat dibaca subsistem internal sesuai fungsi; larangan tool umum tidak berarti startup tak boleh memuat config.

## Lock dan state host

- Satu pipeline memiliki satu lock sesi. Scope manager runtime menggunakan mutator milik pipeline; jangan membuat lock kedua yang menyebabkan self-deadlock.
- Kepemilikan nonce diperiksa lagi sebelum atomic commit state. Release menunggu operasi `runOwned()` yang berjalan; callback release lama tidak boleh menghapus lock baru.
- Metadata korup/izin IO ambigu tidak berarti lock bebas. Jangan mengeviksi pemilik hidup hanya karena mtime lama.
- Host state korup berhenti fail-closed; jangan diam-diam membuat state permisif. Resume ACT kembali PLAN, scope dicabut.
- Direktori state host tidak boleh ditaruh di workspace yang tidak tepercaya saat deployment. Override environment adalah input host tepercaya, bukan otorisasi dari repo.

## Executor dan jaringan

- Jalur `exec`, `/exec`, manual `run`, dan background memerlukan precheck/approval yang sesuai; `execute()` sendiri adalah primitive, bukan policy gate.
- Foreground dan background memakai `sanitizeChildEnv()`: kedua prefix `KURO_*`/`RUKO_*` dan startup/loader hooks disaring. Jangan memberi pengecualian testing pada prefix privat.
- Loader `.env` workspace menolak kedua prefix product, hook/proxy/endpoint berbahaya. Variabel terminal host memiliki trust berbeda dari `.env` repo.
- Jangan menjanjikan sandbox OS untuk shell arbitrer atau script package; jalankan kode asing dalam container/VM terisolasi.
- SSRF guard memeriksa IP tujuan/redirect; jangan mengganti transport pinned dengan fetch yang melakukan DNS ulang tanpa batasan.

## Checkpoint dan dependency

Capture target tervalidasi sebelum penulisan; kegagalan, abort dan delegasi harus memulihkan state disk parent yang tercatat. Jangan menulis di luar checkpoint lewat jalur alternatif tanpa kontrak dan test. Checkpoint bukan rollback subprocess/efek jaringan.

Dependency baru harus cocok Node >=18, disetujui eksplisit, diperiksa audit, serta memperbarui allowlist manifest/lockfile/import tanpa menghapus guard. Test wajib tercantum di [REVIEW.md](REVIEW.md).
