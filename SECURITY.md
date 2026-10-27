# Security Policy

## Supported versions

| Version | Support |
|---------|---------|
| 0.5.x (beta) | ✅ Receives security fixes |
| 0.1.x (alpha) | ❌ No longer supported |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Email: security@kestrel.app (PGP key available on the website)

We will acknowledge your report within **48 hours** and aim to have a fix or mitigation available within **7 days** for critical issues and **30 days** for high/medium issues.

Please include:
- A description of the vulnerability and the impact
- Steps to reproduce (proof-of-concept if possible)
- The version of Kestrel affected
- Whether you believe the issue is exploitable remotely or requires local access

## Security model

Kestrel's primary security guarantees are:

1. **Local by default** — no data leaves the device without explicit user opt-in.
2. **Fail-closed permissions** — if a skill needs approval and there is no approver, it is denied.
3. **Taint tracking** — untrusted content (files, web, OCR) taints the session; risky skills always escalate in tainted sessions.
4. **Prompt injection containment** — fencing, heuristic scan, and policy enforcement combine to prevent injected instructions from triggering skills.
5. **Tamper-evident audit** — SHA-256 hash-chained log detects editing or deletion.

## Known limitations

- The audit chain is tamper-**evident** (detectable) but not tamper-**proof** — someone with disk access can rewrite the whole chain. Anchoring the head hash externally is planned (ENG-11).
- The OS-level sandbox for the shell.run skill is not yet implemented (ENG-10).
- Named pipe authentication (random per-launch token) for local IPC is planned but not yet shipped.

## Scope

In-scope for vulnerability reports:
- Permission policy bypass (a skill executes without required approval)
- Prompt injection bypass (injected instructions trigger risky skills without approval in a tainted session)
- Audit log integrity bypass (chain passes verify after tampering without rewriting the whole chain)
- Path escape (a skill accesses files outside the user-approved roots)
- Memory poisoning bypass (tainted memory recalls without flagging the session as tainted)
- Code execution via the core service or sidecar from an untrusted source

Out of scope:
- Social engineering the user to click Approve on a malicious dialog
- Physical access to the machine (covered by OS security, not Kestrel)
- Third-party model behaviour (we cannot control what the model says, only what it can do)
- Vulnerabilities in bundled dependencies that have no known public exploit
