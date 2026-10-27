# Kestrel: Product Requirements Document

*Version 1.0 draft | 27 October 2026 | Owner: founder-engineer | Status: engine built (22 passing tests); product not yet shipped. Kestrel is a working name and must be replaced before public launch.*

## 1. Summary

Kestrel is a local-first personal AI assistant for Windows. A user answers a short questionnaire on a website, downloads one signed installer, and gets an assistant that runs on their own laptop: voice or text input, local language models, private memory, and skills that can act on the computer (files, apps, reminders, developer and study tools). Every risky action is gated by a permission system and recorded in a tamper-evident audit log.

**Why it can win:** (1) nothing leaves the device by default, (2) it asks before acting and shows evidence, (3) it is designed against prompt injection, (4) personalization comes from a generated config plus learned local memory, (5) an open skill SDK lets others extend it.

**Where we are:** the engine exists in the repo: skill registry, permission policy, taint tracking, hash-chained audit log, SQLite memory, config generator, agent loop, provider interface and CLI. Missing: voice, desktop app, website, installer and updates, vector memory, live model validation, Windows validation.

## 2. Problem and opportunity

- Cloud assistants need personal notes, code and documents to leave the device. Many students and developers will not do that.
- Assistants that can control a computer are risky: a web page or file can hijack them (prompt injection), and there is usually no trustworthy record of what they did.
- Local assistants exist but are hard to set up, and the right model size depends on the laptop.

**Hypothesis to validate before heavy build:** enough students and developers want a private assistant that can act on their PC. Rule: after 10 interviews, at least 60% rate the pain 4 or higher out of 5, and at least half would install a beta. If not, narrow the persona or rethink.

## 3. Target users

| Persona | Profile | Main jobs | Hardware assumption |
| --- | --- | --- | --- |
| Student | College student | Find notes and files, track deadlines, remember facts, study help | 8 to 16 GB RAM, no GPU |
| Developer | Student or junior engineer | Explain errors, git summary, port and environment checks, project context | 16 GB RAM, maybe a GPU |
| General or tutor | Everyday user, small tutors | Launch apps, reminders, file search, daily briefing | 8 GB RAM |

Primary launch segment: students and developers at colleges you can reach directly. Platform: Windows 10 and 11, 64-bit.

## 4. Goals, non-goals, success metrics

**Goals**

- G1: install to first useful task in under 10 minutes, without a terminal.
- G2: useful on an 8 GB laptop (lite tier) and good on 16 GB or more.
- G3: provably safe defaults: no risky action without approval, full audit trail.
- G4: personalized from first launch via the questionnaire.
- G5: extensible through a documented skill SDK.

**Non-goals for v1:** macOS and Linux builds, mobile apps, training or fine-tuning models, enterprise administration, background actions without user approval, matching frontier cloud model quality, cloud sync of private memory.

| Metric | Target (hypothesis, validate in beta) |
| --- | --- |
| Activation: installed users who finish one successful task within 10 minutes | at least 60% |
| Week-1 retention | at least 25% |
| Voice latency, wake word to first spoken audio, standard tier | 3 s or less (median) |
| Text latency, send to first token, standard tier | 2 s or less (median) |
| Crash-free sessions | at least 99% |
| Approval prompts declined | tracked; investigate above 30% (prompt fatigue or bad defaults) |
| Known critical or high security issues at launch | 0 |
| Private beta | 30 users; at least 20 rate it useful |

## 5. Product principles

1. Local by default; cloud is opt-in and visible.
2. Ask before acting; fail closed when nobody can answer.
3. Show evidence and limits with every result.
4. Personalization is data (config and memory), not per-user builds.
5. Boring reliability beats flashy demos.
6. Everything the assistant did is inspectable.

## 6. Release scope

| Release | Audience | Contents |
| --- | --- | --- |
| v0.1 Alpha | You | Engine, CLI, voice loop prototype, live local model, latency benchmarks |
| v0.5 Private beta | 30 users | Desktop app, installer, website questionnaire, 12 or more skills, approvals, audit viewer, memory manager |
| v1.0 Public | Open | Signed auto-update, docs site, hardware auto-tuning, opt-in crash reporting, skill SDK docs |
| v1.x | Growth | More skills, local embeddings search, teach mode, skill marketplace, optional paid sync |

## 7. Functional requirements

Status key: Done = implemented and tested in the repo. Todo = not started. Partial = some parts done.

### 7.1 Website (WEB)

| ID | Requirement | Pri | Acceptance criteria | Status |
| --- | --- | --- | --- | --- |
| WEB-1 | Landing page explaining the privacy and safety model | P0 | States what stays local; links to docs; accessibility score 90 or more | Todo |
| WEB-2 | Questionnaire: assistant name, role, extra packs, tone, strictness, privacy mode | P0 | Validated with the same rules as the engine; produces config.json | Todo (engine side Done) |
| WEB-3 | Account and saved config | P1 | User can re-download or edit config; deleting the account removes all server data | Todo |
| WEB-4 | Download page with OS check, version, checksum, release notes | P0 | Windows 64-bit only; SHA-256 shown; links to the signed installer | Todo |
| WEB-5 | Trademark-name warning | P2 | Warning for names like Jarvis | Done (engine) |
| WEB-6 | Docs site: install, skills, permissions, privacy, SDK | P1 | Skill catalog page generated from skill definitions | Todo |

### 7.2 Installer and updates (INS)

| ID | Requirement | Pri | Acceptance criteria | Status |
| --- | --- | --- | --- | --- |
| INS-1 | One signed Windows installer, per-user, no admin rights | P0 | Installs on clean Windows 10 and 11 VMs; no SmartScreen hard block after signing | Todo |
| INS-2 | Review-changes screen listing startup entry, microphone access, folders | P0 | User can untick startup; nothing hidden | Todo |
| INS-3 | First run: import config, hardware benchmark, model download with progress and resume | P0 | Picks tier automatically; works offline after download | Todo |
| INS-4 | Signed auto-update with changelog and rollback | P1 | Tampered update rejected; previous version restorable in one click | Todo |
| INS-5 | Clean uninstall with option to keep or delete memory and audit log | P0 | No leftover processes or startup entries | Todo |

### 7.3 Desktop app (APP)

| ID | Requirement | Pri | Acceptance criteria | Status |
| --- | --- | --- | --- | --- |
| APP-1 | Tauri shell with tray icon, push-to-talk hotkey, chat window | P0 | Opens in under 2 s; idle memory within the budget in section 10 | Todo |
| APP-2 | Approval dialog showing skill, arguments, reason, taint sources | P0 | Approve or deny once; never silently remembered for tainted sessions | Todo (policy Done) |
| APP-3 | Audit viewer with a verify-chain button | P0 | Lists actions with filters; red banner if the chain is broken | Todo (log Done) |
| APP-4 | Settings: skills, strictness, allowed folders, voice, model, privacy mode | P0 | Changes apply without restart; stored in config.json | Todo |
| APP-5 | Memory manager: view, search, edit, delete, export | P1 | Delete is permanent; export is one JSON file | Todo |
| APP-6 | Data boundary panel: what stayed local versus what went to a cloud model | P1 | Updates live per message | Todo |
| APP-7 | Accessibility: keyboard navigation, screen-reader labels, text scaling | P1 | Core flows pass a manual screen-reader test | Todo |

### 7.4 Voice (VOX)

| ID | Requirement | Pri | Acceptance criteria | Status |
| --- | --- | --- | --- | --- |
| VOX-1 | Wake word plus push-to-talk | P0 | Idle CPU under 5%; fewer than 1 false wake per hour in a quiet room (hypothesis) | Todo |
| VOX-2 | Local streaming speech-to-text (whisper.cpp) | P0 | Acceptable word error rate on a 20-sentence test set per tier | Todo |
| VOX-3 | Local text-to-speech (Piper) with barge-in | P0 | Speech stops within 300 ms of the user speaking or pressing stop | Todo |
| VOX-4 | Microphone indicator and hard mute | P0 | State always visible; mute stops capture rather than ignoring audio | Todo |
| VOX-5 | Swappable STT and TTS provider interface | P1 | Two implementations pass the same contract tests | Todo |

### 7.5 Engine and agent (ENG)

| ID | Requirement | Pri | Acceptance criteria | Status |
| --- | --- | --- | --- | --- |
| ENG-1 | Typed skills with tiers, side effects, network and untrusted-result flags | P0 | defineSkill rejects invalid declarations | Done |
| ENG-2 | Result envelope with evidence and limits | P0 | Every skill returns it; tests enforce it | Done |
| ENG-3 | Permission policy with taint rules, fail-closed | P0 | Matrix test covers all tiers and taint states | Done |
| ENG-4 | Hash-chained audit log with verify | P0 | Edits and deletions detected | Done |
| ENG-5 | Injection containment: fencing, scan, taint, memory-poison tracking | P0 | End-to-end injection test passes | Done |
| ENG-6 | Agent loop with step limit and provider interface | P0 | Runaway loops stop | Done |
| ENG-7 | Ollama provider validated against a live model | P0 | Tool-call success rate measured per model size; target 90% or more on the MVP skill set (hypothesis) | Todo (mock Done) |
| ENG-8 | Cancellation and streaming responses | P1 | User can cancel mid-run; skills receive the abort signal | Partial |
| ENG-9 | Windows validation of all skills and parsing | P0 | Full suite green on a Windows CI runner | Todo |
| ENG-10 | OS-level sandbox for process skills (job objects, restricted token) | P1 | Shell skill cannot touch paths outside allowed roots | Todo |
| ENG-11 | Anchor the audit head hash outside the log file | P2 | Whole-chain rewrite is detected | Todo |

### 7.6 Skills (SKL)

Built and tested: system.info, files.search, files.read\_text, memory.remember, memory.recall, reminders.add, reminders.due, shell.run (blocked by default), dev.port\_lookup, dev.git\_summary, study.notes\_add, study.notes\_search.

To build for the beta: apps.launch (safe), system.volume\_brightness (safe), files.open\_move (ask), web.search (safe, network, untrusted results), study.deadlines (safe), dev.explain\_error (safe). The full 32-skill catalog with hours is in the planning spreadsheet.

Every skill must ship with: input schema, tier and side-effect declaration, evidence and limits, unit tests using a fake OS, a Windows test, and a docs entry.

### 7.7 Memory (MEM)

| ID | Requirement | Pri | Status |
| --- | --- | --- | --- |
| MEM-1 | SQLite with FTS5 ranked recall | P0 | Done |
| MEM-2 | Provenance and poisoning tracking | P0 | Done |
| MEM-3 | Encryption at rest with a key protected by Windows DPAPI | P1 | Todo |
| MEM-4 | Local embeddings search (sqlite-vec) behind the same recall API | P1 | Todo |
| MEM-5 | Retention controls and voice command to forget | P1 | Todo |
| MEM-6 | Export and import | P1 | Todo |

### 7.8 Models and hardware (MDL)

| ID | Requirement | Pri | Status |
| --- | --- | --- | --- |
| MDL-1 | Hardware profiler (RAM, cores, GPU VRAM) | P0 | Partial (tier logic Done; GPU detection Todo) |
| MDL-2 | Model catalog with license check and checksum | P0 | Todo |
| MDL-3 | Auto model pick, with fallback to a smaller model if measured tokens per second is too low | P0 | Todo |
| MDL-4 | Optional cloud model using the user's own key; off by default and visible | P1 | Todo |
| MDL-5 | Compact versus full tool-schema profile | P0 | Done |

### 7.9 Privacy and telemetry (PRV)

| ID | Requirement | Pri | Status |
| --- | --- | --- | --- |
| PRV-1 | No telemetry by default; opt-in crash reports with content scrubbing | P0 | Todo |
| PRV-2 | Raw audio never leaves the device; with a cloud model enabled, only text is sent | P0 | Todo |
| PRV-3 | Plain-language privacy policy and data map | P0 | Todo |
| PRV-4 | Account deletion and data export | P1 | Todo |

## 8. Key user journeys

**A. First install.** (1) User opens the website and answers the questionnaire. (2) Downloads the installer and checks the SHA-256 shown. (3) Installer shows the review-changes screen. (4) First run imports the config, benchmarks the PC and picks a tier. (5) Model downloads with progress and resume. (6) A guided hello test confirms microphone, speech and one safe skill. Success: first useful task within 10 minutes.

**B. Everyday voice use.** User says the wake word, speaks a request, the speech is transcribed locally, the agent calls a safe skill (for example files.search), and the answer is spoken with the evidence available on screen. No prompt appears because the skill is read-only and the session is clean.

**C. Action with approval.** User asks to move DBMS files into a semester folder. files.open\_move is ask-tier, so a dialog shows the exact source and destination. The user approves, the result shows evidence, and the action is written to the audit log.

**D. Injection attempt.** The assistant reads a file or web page containing hidden instructions. The session becomes tainted. If the model then tries to save a memory or run a command, the dialog says untrusted content is in context. The user declines; the audit log records the denial. This journey must be demonstrable in a 60-second demo video.

**E. Forget and leave.** User asks to forget a fact, opens the memory manager to confirm it is gone, exports everything, and uninstalls with the choice to delete all local data.

## 9. Architecture

```
Website (Next.js, Postgres)           Desktop (Tauri shell + web UI)
  questionnaire -> config.json  --->    tray, chat, approvals, audit viewer, settings
  accounts, downloads, docs                    |  JSON-RPC over stdio or named pipe
                                               v
                                  Core service (Kestrel engine, sidecar)
                                  registry -> policy -> skills -> audit
                                  memory (SQLite + FTS5) | agent loop
                                       |                    |
                          Voice sidecars                Model runtime
                  wake word, whisper.cpp, Piper     Ollama or llama.cpp (local)
                                                    optional cloud model (user key)
```

| Component | Responsibility | Technology | Status |
| --- | --- | --- | --- |
| Core service | Skills, permissions, taint, audit, memory, agent loop, config | Node 22 (zero dependencies) | Built |
| Desktop shell | Windows, tray, hotkeys, approval UI, settings, auto-update | Tauri (Rust) with a web UI | To build |
| Voice | Wake word, STT, TTS, mute, barge-in | Native sidecars: whisper.cpp, Piper, wake word engine | To build |
| Model runtime | Local inference and tool calling | Ollama first; bundled llama.cpp evaluated later | Provider built; live test pending |
| Website | Questionnaire, accounts, downloads, docs | Next.js and Postgres | To build |
| Release service | Signed installers, update manifest, checksums | Static hosting plus signing in CI | To build |

**Trust boundaries.** Trusted: the user, the desktop UI, the core service. Untrusted: model output, anything returned by skills flagged untrusted (web, file bodies, commit messages, OCR), downloaded config fields that grant power, third-party skills.

**Process rules.**

- The UI and core service talk over stdio or a named pipe. If a TCP port is ever used, bind to 127.0.0.1 only, with a random per-launch token, so other local programs cannot call skills.
- Approvals are requested by the core service and answered only by the UI.
- The website can never grant power. A downloaded config is schema-validated; the app ignores unlockedBlocked and autoApprove coming from the website and only accepts them from local settings changed by the user.
- The audit file is appended synchronously so a crash cannot lose a completed action.

**Local data layout (Windows).** Config, memory.db and audit.jsonl in the user AppData folder; models in the local AppData folder; logs rotate locally and are never uploaded without opt-in.

**Technical decisions to settle early.**

| ID | Decision | Options | Recommendation |
| --- | --- | --- | --- |
| D1 | Wake word engine | openWakeWord (open source, Python-based), Porcupine (commercial SDK with usage terms) | Benchmark both in the voice prototype; avoid shipping a full Python runtime if possible |
| D2 | Model runtime | Require Ollama, or bundle llama.cpp | Use Ollama for alpha; decide before beta based on install friction and tool-call reliability |
| D3 | Engine packaging | Bundle a pinned Node runtime as sidecar, or port to Rust | Bundle Node for v1; revisit if size or the experimental node:sqlite module becomes a problem (alternative: a native SQLite binding) |
| D4 | Secrets storage | Windows Credential Manager or DPAPI | Use DPAPI for the memory key and API keys |

## 10. Non-functional requirements

All numeric targets are planning hypotheses to validate on real laptops in the voice and beta milestones.

| Area | Requirement |
| --- | --- |
| Performance | App start 2 s or less; idle CPU 2% or less excluding wake word (wake word 5% or less total); app plus core service idle memory 300 MB or less excluding the model |
| Latency | Standard tier: text first token 2 s or less; voice wake to first audio 3 s or less (median). Lite tier may be slower but must stay usable with cloud fallback offered |
| Size | Installer 150 MB or less excluding models; models are downloaded on first run with resume and checksum |
| Reliability | Core service auto-restarts after a crash; no data loss in memory or audit; 99% crash-free sessions |
| Compatibility | Windows 10 (22H2) and 11, x64. English with Indian-English accent test set for speech in v1 |
| Privacy | No telemetry by default; no raw audio off the device; cloud use always visible in the UI |
| Security | See section 12; no known high or critical issues at beta or launch |
| Accessibility | Keyboard-only use of all core flows; screen-reader labels; scalable text; captions for spoken output |
| Maintainability | Zero or minimal runtime dependencies in the core; every skill has tests; CI on Windows and Linux |
| Observability | Local logs and an in-app diagnostics export the user can choose to share |

## 11. Interfaces and data contracts

**config.json (generated by the website and the CLI).** Fields: version; assistant (name, tone, persona); packs; skills (enabled, autoApprove, unlockedBlocked); privacy (mode, cloudModelAllowed); hardware (tier, model plan, schema profile); warnings. Validation rules already live in the engine (validateAnswers, generateConfig) and must be shared with the website so both reject the same inputs.

**Skill contract.** A skill declares: name (pack.action), pack, tier (safe, ask, blocked), sideEffects (none, memory, fs-write, process, network), network, returnsUntrusted, redactArgs, timeoutMs, inputSchema, and run(args, ctx) returning result, evidence and limits. A safe-tier skill may not declare fs-write or process side effects.

**Audit entry.** seq, timestamp, session, skill, redacted args, tainted flag, decision (allow, reason, prompted), outcome (ok, error code), limits, duration, previous hash, hash.

**Core service RPC (UI to engine).**

| Method | Purpose |
| --- | --- |
| skills.list | Enabled skills and tiers |
| chat.send | Send a user message; streams events (token, tool call, tool result, final) |
| chat.cancel | Abort the current run |
| approval.request (engine to UI) and approval.respond | Ask the user and return the decision |
| config.get, config.update | Read and change local settings |
| audit.list, audit.verify | Show history and check the chain |
| memory.list, memory.delete, memory.export | Memory manager |

**Website API (v1).**

| Endpoint | Purpose |
| --- | --- |
| POST /api/config | Validate questionnaire answers and return config.json |
| GET /api/releases/latest | Version, checksum, changelog, installer URL |
| POST /api/auth and DELETE /api/account | Sign in and delete the account with all stored data |
| GET /api/update-manifest | Signed update manifest used by the app |

## 12. Security requirements

| Threat | Example | Mitigation | Status |
| --- | --- | --- | --- |
| Prompt injection | Web page tells the assistant to leak files | Taint tracking, approval for risky skills in tainted sessions, fencing, injection scan, evidence in results | Built |
| Memory poisoning | Attacker plants a standing instruction in memory | Provenance on every memory; recalled untrusted memory re-taints the session | Built |
| Malicious repository | Git config runs a command | Hostile settings disabled; negative-control test | Built |
| Path escape | Skill reads files outside allowed folders | realpath containment, symlinks not followed in search | Built |
| Command execution | Model runs arbitrary commands | No shell, blocked tier, per-call approval, timeouts, output caps | Built; OS sandbox Todo |
| Audit tampering | Edit history to hide actions | Hash chain; external anchor | Chain Built; anchor Todo |
| Local program abuse | Another process calls the core service | Named pipe or stdio, random token if TCP | Todo |
| Supply chain | Malicious dependency or update | Pinned lockfiles, minimal dependencies, SBOM, signed updates | Todo |
| Malicious third-party skill | Skill claims safe but exfiltrates | Declared capabilities enforced, signed skills, review before listing | v1.x |
| Config tampering | Website or file grants extra power | Ignore power-granting fields from downloads | Todo |

Additional requirements: SEC-1 external security review of the permission layer before beta; SEC-2 coordinated vulnerability disclosure contact published in SECURITY.md and on the website; SEC-3 mutation testing on policy and audit code with a minimum score set in CI; SEC-4 dependency audit in CI on every pull request.

## 13. Delivery plan (end to end)

**How to read this.** Hours are my planning estimates, not measurements. The planning spreadsheet totals about 530 hours for the original MVP scope. The engine already covers roughly 120 to 140 of those hours, but the spreadsheet left out work that this PRD makes explicit (live model validation, Windows CI, approval and audit UI, settings, memory manager, docs site, model downloader). The corrected total below is about 516 hours remaining, with no buffer. Add 20 to 30% contingency for real life.

| Milestone | What gets built | Req. IDs | Hours | Cumulative weeks at 12 h/week |
| --- | --- | --- | --- | --- |
| M0 Validate and name | 10 interviews, go or rethink decision, original name, domain, repo and license choice | tasks T01, T02 | 18 | 1.5 |
| M1 Voice prototype and benchmark | Wake word, local STT, local TTS, LLM wrapper, end-to-end latency on 3 laptops; decide D1 and D2 | VOX-1 to VOX-4, tasks T03 to T07 | 86 | 8.7 |
| M2 Engine on real models and Windows | Live Ollama integration and tool-call success rates, Windows CI, fix Windows skill bugs, GPU detection | ENG-7, ENG-9, MDL-1 | 30 | 11.2 |
| M3 Desktop app | Tauri shell, IPC, approval dialog, audit viewer, settings, memory manager, tray and hotkey | APP-1 to APP-5, ENG-8 | 100 | 19.5 |
| M4 Website and installer | Questionnaire and config API, accounts, download page, installer with review screen, first-run setup, model downloader, code signing, signed updates with rollback | WEB-1 to WEB-4, INS-1 to INS-5 | 100 | 27.8 |
| M5 Skills and memory v2 | Six more skills, encrypted memory, hardware-based model picker, compact schemas wired to tier, data boundary panel | SKL, MEM-3, MDL-2 to MDL-4, APP-6 | 60 | 32.8 |
| M6 Quality and security | CI with mutation tests, crash reporting opt-in, external security review, accessibility pass, performance budgets met | SEC-1 to SEC-4, PRV-1, APP-7 | 50 | 37 |
| M7 Private beta | 30 users, feedback board, fix-forward releases | metrics in section 4 | 40 | 40.3 |
| M8 Public launch | Docs site, 3 demo videos, launch posts, support channel | WEB-6, PRV-3 | 32 | 43 |

At 12 hours a week this is about 43 weeks; at 20 hours a week about 26 weeks. If you have a teammate, M4 (website and installer) can run in parallel with M3.

**Exit criteria (a milestone is done only when all are true).**

- M0: at least 10 interviews logged; 60% or more rate pain 4 or higher; name and domain secured.
- M1: the voice loop works on three different laptops; latency report written; decisions D1 and D2 recorded.
- M2: tool-call success rate measured for at least three model sizes; entire test suite passes on Windows and Linux CI.
- M3: a tester can install the dev build, chat, approve and deny actions, view and verify the audit log, and edit settings without touching a terminal.
- M4: clean-VM install on Windows 10 and 11, signed installer, update and rollback demonstrated, questionnaire to running assistant in under 10 minutes.
- M5: all MVP skills pass their acceptance tests; hardware picker chooses a working model on 8 GB and 16 GB machines.
- M6: no open high or critical security findings; performance budgets in section 10 met or the miss is documented and accepted.
- M7: success metrics in section 4 measured; top five beta issues fixed.
- M8: docs live, installer download works for strangers, support channel staffed.

**Tasks to add to the Roadmap sheet.** Live model benchmark (16 h), Windows CI and fixes (14 h), IPC and approval dialog (30 h), audit viewer (16 h), settings and memory manager (24 h), docs site (20 h), first-run setup and model downloader (20 h), accessibility pass (12 h).

**Weekly operating rhythm.** Monday: pick the next two tasks from the Roadmap sheet. Friday: update statuses, check the Dashboard (hours done, risks), write a short changelog. Every milestone: demo video of the current state.

## 14. Quality assurance plan

| Layer | What is tested | Tooling | Gate |
| --- | --- | --- | --- |
| Unit | Skills with a fake OS, schema, policy, audit, config | node:test (built) | Every commit |
| Contract | Provider interface, STT and TTS engines, skill contract | Shared contract suites | Every commit |
| Injection suite | A corpus of 50 or more attack texts in files, web results, commit messages and memory; the metric is risky actions executed without approval, target 0 | Scripted provider plus real-model runs | Before every release |
| Integration | Engine with a real small local model on the MVP skills | Ollama in CI or nightly | Nightly |
| UI | Website flows and desktop approval, settings and audit screens | Playwright and Tauri WebDriver | Every pull request |
| Windows matrix | Windows 10 and 11, 8 GB and 16 GB, with and without GPU | VMs and two physical laptops | Each milestone |
| Installer | Clean install, upgrade, rollback, uninstall, offline first-run after model download | Fresh VM snapshots | Each release |
| Performance | Latency and memory budgets from section 10 | Benchmark script with fixed prompts | Each milestone |
| Security | Dependency audit, mutation tests on policy and audit code, external review | CI plus reviewer | Before beta and launch |
| Accessibility | Keyboard-only run-through and a screen reader pass | Manual checklist | Before beta |

**Definition of done for any feature.** Requirement ID referenced; acceptance criteria met; tests added and passing on Windows and Linux; audit and permission behavior reviewed; docs updated; no new dependency without a written reason; changelog entry.

## 15. Release and operations

- **Versioning and channels:** semantic versioning with a beta channel and a stable channel; the update manifest is signed.
- **Signing:** a code-signing certificate or a managed signing service is needed to reduce SmartScreen warnings; check current pricing and identity requirements early because verification can take time.
- **Hosting:** website on a managed host; installers and manifests on static storage with checksums; a status page is optional until after launch.
- **Release checklist:** tests green, injection suite green, installer tested on clean VMs, changelog, checksum published, rollback tested, security contact verified.
- **Support:** public issue tracker plus a community chat; an in-app diagnostics export with content scrubbed; a target to answer beta users within 48 hours.
- **Incident response:** a documented process for security reports, a way to push a signed emergency update, and a user notice template.

## 16. Go-to-market and business model

- **Positioning:** a private assistant on your PC that asks before it acts and can prove what it did.
- **Proof content:** a 60-second video of the injection demo (journey D), a benchmark post showing latency per laptop tier, and a technical write-up of the permission design.
- **Channels:** your own college groups first, then developer communities, a Show HN style post, and Product Hunt after the beta.
- **Open source:** publish the core under a permissive license; keep the website, sync service and any marketplace as the product. This builds trust for a privacy product and makes the project strong on a resume.
- **Monetization (later, not before product-market fit):** free local app; optional paid encrypted backup and sync; premium voices or skills. No pricing commitments in v1.

## 17. Legal and compliance checklist

This is a checklist, not legal advice; consult a qualified professional before launch.

- **Name and trademark:** choose an original name and search trademarks and domains before investing in branding. Do not launch under Jarvis, Friday or other Marvel names.
- **Model licenses:** every model you offer has its own license (commercial use, redistribution, acceptable use). Record each in the model catalog and download from official sources at first run rather than redistributing in the installer.
- **Third-party components:** verify the license of every library, speech engine and voice you ship, including individual voice licenses; keep an attribution file and an SBOM.
- **Reference projects:** REA and similar projects were used for design inspiration only; check a project's license before reusing any of its code.
- **Privacy:** publish a plain-language privacy policy and data map; check which data protection laws apply to your users (for example India's Digital Personal Data Protection Act) and what the website must do for account data, deletion and consent.
- **Terms of service and acceptable use:** especially for skills that can run commands.

## 18. Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Local models too slow or unreliable at tool calling on student laptops | High | High | Hardware tiers, compact schemas, small-model fallback, cloud option, measure in M1 and M2 |
| Prompt-injection bypass found after launch | Medium | High | Policy is the boundary, injection corpus in CI, external review, emergency update path |
| Voice quality or latency disappoints | High | Medium | Early benchmark, push-to-talk as the dependable default, wake word optional |
| Windows differences break skills | Medium | Medium | Windows CI from M2, real-laptop tests |
| Installer blocked by SmartScreen or antivirus | High | Medium | Code signing early, reputation building, portable zip option |
| Experimental node:sqlite changes or breaks | Medium | Medium | Pin the Node version, wrap storage behind an interface, test a native binding as a fallback |
| Scope creep | High | High | MVP flag on skills, milestone exit criteria, parking lot for ideas |
| Single-person burnout | Medium | High | Realistic hours per week, demo every milestone, cut scope before quality |
| Crowded market | Medium | Medium | Lead with privacy, safety proof and install simplicity rather than raw capability |

## 19. Open questions

1. Product name (must be original) and domain.
2. Decisions D1 to D4 in section 9.
3. Open-source license for the core and what stays closed.
4. Languages after English (Hindi first?) and the speech models needed.
5. Whether to support macOS or Linux after v1, based on beta demand.
6. Who reviews security before beta (a mentor, a community review, a paid reviewer).

## 20. Next ten actions

1. Run the 10 interviews and log them in the Interviews sheet.
2. Choose a name; check trademark and domain.
3. Push the repo with CI on Windows and Linux.
4. Run the full test suite on a real Windows laptop and fix failures.
5. Run the Ollama provider against a live model and record tool-call success.
6. Build the voice prototype and the latency benchmark script.
7. Add the missing tasks from section 13 to the Roadmap sheet.
8. Sketch wireframes for the approval dialog and the audit viewer.
9. Draft the privacy data map (what stays local, what never leaves).
10. Record the decisions D1 to D4 in a short decision log.

## Appendix: glossary

- **Skill:** a typed tool the assistant can call, with a tier and declared side effects.
- **Tier:** safe (read-only), ask (needs approval), blocked (off until unlocked, then asks every time).
- **Taint:** a session flag set when untrusted content (web, file text, OCR, clipboard) enters the context.
- **Envelope:** the standard skill result containing result, evidence and limits.
- **Audit chain:** the append-only log where each entry includes the previous entry's hash.
- **Compact profile:** a smaller tool-schema format for small local models.
