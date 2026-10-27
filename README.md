# Kestrel (working name)

A **local-first, privacy-first personal AI assistant** for your computer. It runs on your machine, learns your
routines in a local SQLite memory, and can *act* through typed, permission-tiered skills, with every action
written to a tamper-evident audit log.

> Working name only. Pick an original name before publishing; "JARVIS" is a Marvel trademark.

This repository is the **engine** (zero runtime dependencies, Node >= 22.5). The desktop shell, voice loop and
website come next (see `docs/ROADMAP.md`).

## What makes it different from "an LLM with tools"

| Problem with typical agents | What Kestrel does |
|---|---|
| A webpage/file can hijack the agent (prompt injection) | Sessions track **taint**; once untrusted content enters context, any skill with side effects or network access must be approved by the user. Untrusted text is fenced as data. |
| "Trust me, I did it" | Every skill returns `{result, evidence, limits}`: what it did, what proves it, and what it could not verify. |
| No record of what the assistant did | Append-only **hash-chained audit log**; `kestrel audit verify` detects edits and deletions. |
| Big tool schemas choke small local models | **Compact schema profile** (~43% fewer schema tokens here) chosen automatically by hardware tier. |
| Poisoned memory | Memories saved while tainted are flagged and re-taint the session when recalled. |
| Hostile repos run code via git config | `dev.git_summary` disables `core.fsmonitor` / hooks. A negative-control test shows the exploit works without it. |
| One-size-fits-all install | Website questionnaire -> `config.json` (packs, strictness, privacy, hardware plan). One signed installer for all users. |

Design patterns (MCP-style tools, evidence + limits, CLI parity, compact schemas) are borrowed from the open-source
[REA](https://github.com/morluto/rea) project.

## Try it

```bash
npm test                                   # 22 tests
node bin/kestrel.js skills                 # skills, tiers, schema token budget
node bin/kestrel.js run system.info
node bin/kestrel.js run files.search '{"query":"dbms"}'
node bin/kestrel.js config answers.json    # personalised config from questionnaire answers
node bin/kestrel.js audit verify
node bin/kestrel.js doctor                 # hardware tier + model plan
```

`answers.json`: `{"assistantName":"Atlas","role":"developer","strictness":"balanced","tone":"concise","privacy":"offline"}`

## Layout

```
src/core/      envelope, schema, skill, registry, permissions, taint, audit, memory, hardware, config, sandbox, exec
src/skills/    core (files, memory, reminders, shell), dev (ports, git), student (notes)
src/agent/     tool-calling loop + providers (scripted for tests, Ollama for local models)
bin/kestrel.js CLI (same skills as the assistant; "CLI parity")
test/          unit + end-to-end injection test
docs/          ARCHITECTURE.md, SECURITY.md, ROADMAP.md
```

## Status (honest)

- Done and tested: everything above, on Linux. Windows-specific parsing (`netstat`) is unit-tested with sample output but not run on a real Windows machine yet.
- `OllamaProvider` is tested with a mocked HTTP server only; it has not talked to a live Ollama yet.
- Not built yet: voice (wake word, whisper.cpp, Piper), desktop shell (Tauri), website, installer/updates, vector search.
