# Security model

Threat: the assistant reads content an attacker controls (web page, file, commit message, OCR text, clipboard) and
that content tries to make it act against the user.

## Defences (and their limits)
1. **Taint + policy (the real boundary).** Untrusted content in context => any skill with side effects or network must be approved by the user. Auto-approve is ignored while tainted. Heuristics do not decide anything.
2. **Fencing.** Untrusted tool output is wrapped in `<untrusted>` with a system rule telling the model it is data. This reduces, but cannot eliminate, model compliance with injected text; hence (1).
3. **Heuristic scan.** Flags phrases like "ignore previous instructions". Easily bypassed; only used for user-visible warnings.
4. **Filesystem roots.** Paths are resolved with `realpath` and must lie inside user-approved folders; symlinks are not followed in search.
5. **Process execution.** No shell, bounded time/output; `shell.run` is `blocked` until explicitly unlocked and then asks on every call.
6. **Audit log.** Hash-chained; detects edits/deletions. It is tamper-*evident*, not tamper-proof: an attacker with disk access can rewrite the whole chain. Mitigation planned: anchor the head hash off-device or in the OS credential store.
7. **Memory poisoning.** Memories created in tainted sessions carry their provenance; recalling them re-taints the session.

## Known gaps
- Taint is session-wide (conservative): after reading one web page, every risky action in that session prompts.
- No OS-level sandbox for skills yet (planned: Windows AppContainer / job objects).
- Secrets: audit args can be redacted per skill via `redactArgs`, but no central secret scanner yet.
- Not yet reviewed by an external security reviewer.
