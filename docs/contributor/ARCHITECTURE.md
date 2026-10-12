# Peta arsitektur

Kuro adalah CLI Node.js/TypeScript lokal. Output model adalah data tidak tepercaya; otorisasi berasal dari host/pengguna, bukan prompt atau field approval buatan model.

## Alur utama

```text
Pengguna / stdin
       |
       v
index.ts -- trust/config --> loop.ts / commands.ts
       |                              |
       | bootstrap                    v
       +--> SecurityPipeline -----> Agent / Context <--> LLMProvider
            | FileLock                 |
            | HostState                | tool call yang diparse
            | ScopeManager             v
            +-------------------- DispatcherGate
                                       | PLAN/scope
                                       v
                              tools.ts: path/exec guards
                                       | checkpoint sebelum mutasi
                    +------------------+------------------+
                    v                  v                  v
              filetools/skills    executor/processes    webtools
              undo/checkpoint     approval/Guardian     hostFetch
                    |                  |                  |
                    +------ hasil terbatas ke Agent ------+
                           sukses: commit checkpoint
                           gagal/abort: rollback tercatat
```

## Berkas kunci dan tanggung jawab

| Area | Berkas | Tanggung jawab |
| --- | --- | --- |
| Entry | `src/index.ts` | Argumen, konfigurasi, trust, bootstrap/release pipeline dan recovery checkpoint |
| UI | `src/core/loop.ts`, `tui.ts`, `ui.ts`, `activity.ts` | REPL, input, rendering, aktivitas |
| Agen | `src/agent/agent.ts`, `commands.ts` | Loop tools, slash commands, lifecycle giliran, delegasi |
| Model | `src/agent/llm.ts`, `roles.ts`, `src/core/context.ts` | Provider/streaming, system prompt, anggaran konteks |
| Otorisasi | `src/core/securityPipeline.ts`, `dispatcher/dispatcherGate.ts` | Composition root dan penolakan awal PLAN/mutasi |
| Scope | `src/core/approval/scopeAmendment.ts` | Resolusi fisik, kontrak path, hash/binding persetujuan, circuit breaker |
| State/lock | `src/core/state/hostState.ts`, `fileLock.ts` | State host, resume fail-safe, atomic rename, kepemilikan nonce |
| Tool boundary | `src/agent/tools.ts`, `filetools.ts`, `src/core/tools/secureRead.ts` | Alias efektif, containment, file sensitif, pembacaan aman |
| Shell | `src/core/approval.ts`, `executor.ts`, `src/agent/processManager.ts` | Risiko, konfirmasi, environment, timeout dan lifecycle proses |
| Grants | `src/core/approval/sessionAllowlist.ts` | Izin sekali/sesi yang terikat command + cwd + jenis operasi |
| Network | `src/agent/webtools.ts`, `src/core/network/hostFetch.ts` | Pemeriksaan IP/redirect dan transport SSRF |
| Data | `src/core/productPaths.ts`, `envCompat.ts` | Seleksi path/variabel Kuro dan alias Ruko; bukan migrasi destruktif |
| Persistence | `src/core/config.ts`, `session.ts`, `history.ts`, `memory.ts`, `skills.ts` | Config/transkrip/catatan dengan kebijakan khusus tiap subsistem |
| Pemulihan | `src/core/mutationCheckpoint.ts`, `undo.ts` | Rollback satu giliran dan undo per-file; bukan snapshot seluruh OS |
| Peta kode | `src/core/repoMap.ts` | AST simbol/import JS/TS, inventaris/output terbatas |
| Verifikasi | `src/core/verification/`, `executor/resourceGovernor.ts` | Compiler gate dan guard manifest sebagai subsistem terpisah |
| Test | `src/tests/`, `scripts/run-tests.mjs` | Test Node built-in dan enumerasi lintas OS |

## Dua bidang state

State runtime otoritatif ada di `~/.kuro/sessions/<sessionId>/state.json` (atau lokasi legacy/override). Transkrip workspace ada di `./.kuro/sessions/<id>.json`; keduanya berbeda. File `plan.json` workspace bukan sumber izin. Resume state ACT mereset mode ke PLAN dan membatalkan scope.

Delegasi mewarisi batas host, scope, mode, dan checkpoint parent; bukan jalur baru untuk memperoleh izin. Pemanggil internal `execute()`/`ProcessManager` tidak menjalankan seluruh dispatcher dengan sendirinya: jalur baru wajib memasang guard di atasnya.

Batasan jaminan ada di [threat model](../auditor/THREAT-MODEL.md) dan [known limits](../auditor/KNOWN-LIMITS.md).
