# Architecture

```
 Website (Next.js)            Desktop app (Tauri)                       Local runtime
 questionnaire ──config.json──▶ settings UI, approval prompts ◀──────▶  Kestrel engine (this repo)
 accounts, downloads            voice loop (planned)                      ├─ Registry ─ Policy ─ Audit
                                                                           ├─ Skills (core/dev/student/3rd-party)
                                                                           ├─ Memory (SQLite + FTS5)
                                                                           └─ Provider: Ollama / llama.cpp / cloud(opt-in)
```

## Request lifecycle (`Registry.invoke`)
1. Look up skill, apply schema defaults, validate arguments (unknown properties rejected).
2. `Policy.decide`: enabled? tier? session tainted? -> allow / ask user / deny (fail-closed with no approver).
3. Run with timeout + AbortSignal; errors and timeouts become envelopes, never crashes.
4. If the skill returns untrusted data, taint the session, scan for injection phrases, attach warnings to `limits`.
5. Append one audit entry (redacted args, decision, outcome, duration), chained by SHA-256.

## Why these decisions
- **Dependency injection (`ctx`)**: skills receive `exec`, `memory`, `roots`, `clock`. Tests never touch the real OS; the same code runs in the CLI and the desktop app.
- **Config, not per-user builds**: personalisation is data (`config.json`), so one signed installer serves everyone and updates stay simple.
- **No shell, ever**: `exec` uses `execFile` with `shell:false`, timeouts and output caps.
- **Zero runtime dependencies**: smaller supply-chain surface for a tool that touches your files.
- **Tool names**: dotted internally (`files.search`); providers map them to model-safe names.
