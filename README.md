# Kestrel — Local-First AI Assistant

[![Tests](https://img.shields.io/badge/tests-31%20passing-22c55e)](./test)
[![Node](https://img.shields.io/badge/node-%3E%3D22.5-6366f1)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-94a3b8)](./LICENSE)
[![Status](https://img.shields.io/badge/status-private%20beta-f59e0b)](./CHANGELOG.md)

> **Private. Auditable. Runs on your laptop.**

Kestrel is a local-first personal AI assistant for Windows. Voice or text input, local language models, private SQLite memory, and a tamper-evident audit log of every action. It asks before acting — and can prove what it did.

---

## What's built

| Component | Status | Notes |
|-----------|--------|-------|
| **Core engine** | ✅ **31 tests passing** | |
| Skill registry + `defineSkill` | ✅ Done | |
| Permission policy (safe/ask/blocked) | ✅ Done | |
| Taint tracking + injection scan | ✅ Done | |
| Hash-chained audit log | ✅ Done | |
| SQLite memory + FTS5 recall | ✅ Done | |
| Config generator + validator | ✅ Done | |
| Agent loop + provider interface | ✅ Done | |
| Hardware profiler (tier logic) | ✅ Done | |
| Ollama provider (mock tested) | ✅ Done | Live test pending |
| **Skills (20)** | ✅ Done | |
| system.info, files.search, files.read_text | ✅ | |
| memory.remember, memory.recall | ✅ | |
| reminders.add, reminders.due | ✅ | |
| shell.run (blocked by default) | ✅ | |
| apps.launch, files.open_move | ✅ | |
| system.volume_brightness | ✅ | |
| web.search (DuckDuckGo) | ✅ | |
| dev.port_lookup, dev.git_summary | ✅ | |
| dev.explain_error | ✅ | |
| study.notes_add, study.notes_search | ✅ | |
| study.deadlines | ✅ | |
| **JSON-RPC IPC server** | ✅ Done | `bin/kestrel-service.js` |
| **CLI** | ✅ Done | `kestrel skills/run/audit/config/doctor` |
| **Website (Next.js)** | ✅ Done | `website/` |
| Landing page | ✅ | |
| Questionnaire / setup | ✅ | |
| Download page + checksum | ✅ | |
| Docs site | ✅ | |
| API: POST /api/config | ✅ | |
| API: GET /api/releases/latest | ✅ | |
| **Desktop app web UI** | ✅ Done | `desktop/` |
| Chat with streaming tokens | ✅ | |
| Approval dialog | ✅ | |
| Audit viewer + verify | ✅ | |
| Memory manager (search/delete/export) | ✅ | |
| Settings panel | ✅ | |
| Skills list | ✅ | |
| **Tauri shell** | 🔧 Scaffolded | Needs Rust build |
| Rust main.rs (sidecar spawn, IPC, tray) | 🔧 Written | Needs `cargo build` |
| Tauri config | 🔧 Written | |

---

## Quick start (CLI)

```powershell
# Requires Node 22.5+
git clone <repo>
cd kestrel
npm test                              # 31 tests

node bin/kestrel.js doctor            # detect hardware tier
node bin/kestrel.js skills            # list all skills
node bin/kestrel.js run system.info '{}'
node bin/kestrel.js audit verify
```

## Website dev server

```powershell
cd website
npm install
npm run dev   # → http://localhost:3000
```

## Desktop app (requires Rust)

```powershell
# 1. Install Rust: https://rustup.rs/
# 2. Install Tauri CLI:
npm install -g @tauri-apps/cli@latest

cd desktop
npm install
npm run tauri dev   # opens the window with mock data
```

## Architecture

```
Website (Next.js)              Desktop (Tauri shell + web UI)
  questionnaire → config.json → chat, approvals, audit, memory, settings
  API routes                         ↕ JSON-RPC over stdio
                              Core service (kestrel-service.js)
                              registry → policy → skills → audit
                              memory (SQLite FTS5) | agent loop
                                   ↕                    ↕
                         Voice sidecars           Model runtime
                   whisper.cpp, Piper, wake    Ollama (local)
                                               optional cloud key
```

## Security

See [SECURITY.md](./SECURITY.md) for the vulnerability disclosure policy.

**Key guarantees:**
- Local by default — nothing leaves the device without opt-in
- Fail-closed — risky skills are denied if nobody can approve
- Taint tracking — file/web content taints sessions; risky skills always escalate
- Hash-chained audit — any edit or deletion breaks verification

## Remaining work (what you build next)

See the [Delivery plan](#delivery-plan) in the PRD. Priorities:
1. **M1** — Voice prototype (whisper.cpp STT + Piper TTS + wake word)
2. **M2** — Live Ollama test on a real model + Windows CI
3. **M3** — Tauri build (install Rust, run `npm run tauri build`)
4. **M4** — Signed Windows installer (NSIS/WiX via Tauri bundle)

## License

MIT — core engine. See [LICENSE](./LICENSE).
