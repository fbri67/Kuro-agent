# Setup kontributor

Halaman ini untuk membangun dan menguji source Kuro; tidak memerlukan API key untuk suite test.

## Prasyarat

- Node.js >=18 dan npm; Git untuk clone/branch.
- Windows: PowerShell/cmd; Linux/macOS/WSL/Termux: terminal biasa.
- Tiga dependency runtime yang disetujui: `@babel/parser`, `@vscode/ripgrep`, `diff`. Kontraknya ada di `src/tests/runtime_dependency_guard.test.ts`.

## Instalasi dari source

```sh
git clone https://github.com/fbri67/Kuro-agent.git
cd Kuro-agent
npm ci
npm run typecheck
npm test
```

`npm test` membangun TypeScript lalu menjalankan runner lintas platform. Untuk build saja, gunakan `npm run build`; hasilnya berada di `dist/` dan tidak di-commit.

## Menjalankan CLI

```sh
node dist/index.js --version
node dist/index.js --help
node dist/index.js
```

Perintah terakhir membuka sesi interaktif dan dapat meminta trust/wizard. Gunakan workspace serta HOME sementara untuk eksperimen; jangan menguji mutasi pada data pribadi. Untuk biner global, `npm install -g .` memasang `kuro` (opsional, tidak diperlukan untuk development).

## Uji terfokus

Setelah build:

```sh
node scripts/run-tests.mjs --filter product_migration
node scripts/run-tests.mjs --filter sensitive_protection.test.js
npm run test:e2e
npm run test:urls
```

Filter adalah substring nama berkas, bukan glob. Pastikan runner menunjukkan berkas dan test yang memang dimaksud; exit 0 tanpa cakupan yang benar bukan bukti cukup.

## Penyimpanan dan kompatibilitas

Instalasi baru memakai `./.kuro/` untuk config, transkrip, memory, undo, dan skills; state otoritatif/trust berada di HOME. Lokasi `.ruko/` lama tetap dipakai bila path Kuro yang bersesuaian belum ada. Bila keduanya ada, path `.kuro` yang sudah ada menang; tidak ada pemindahan/merge otomatis. `KURO_*` menang atas alias `RUKO_*`, termasuk nilai kosong eksplisit.

Jangan commit `.env*`, `.kuro/`, `.ruko/`, token, atau log sesi. Baca [aturan keamanan](SECURITY-RULES.md) sebelum menyentuh guard dan [panduan review](REVIEW.md) sebelum PR. Catatan `docs/internal/` bukan prasyarat onboarding.
