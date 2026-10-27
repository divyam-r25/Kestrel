import { appendFileSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname } from "node:path";

// Append-only, hash-chained JSONL. Each entry commits to the previous one, so editing or deleting
// a past line breaks verification. This is tamper-EVIDENT (detectable), not tamper-proof: someone
// with disk access can rewrite the whole chain. Anchor the head hash elsewhere for stronger guarantees.

const GENESIS = "0".repeat(64);

export function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
  return JSON.stringify(v);
}
const sha = (s) => createHash("sha256").update(s).digest("hex");

export class AuditLog {
  constructor(path, { clock = () => new Date().toISOString() } = {}) {
    this.path = path;
    this.clock = clock;
    mkdirSync(dirname(path), { recursive: true });
    const { entries, valid, brokenAt } = AuditLog.verify(path);
    if (!valid) throw new Error(`audit log is corrupt at entry ${brokenAt}; refusing to append`);
    this.seq = entries;
    this.head = entries ? AuditLog.#lastHash(path) : GENESIS;
  }

  static #lastHash(path) {
    const lines = readFileSync(path, "utf8").trim().split("\n");
    return JSON.parse(lines.at(-1)).hash;
  }

  append(body) {
    const entry = { seq: this.seq + 1, ts: this.clock(), ...body, prev: this.head };
    entry.hash = sha(canonical(entry));
    appendFileSync(this.path, JSON.stringify(entry) + "\n");
    this.seq = entry.seq;
    this.head = entry.hash;
    return entry;
  }

  static read(path) {
    if (!existsSync(path)) return [];
    return readFileSync(path, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  }

  static verify(path) {
    if (!existsSync(path)) return { valid: true, entries: 0, brokenAt: null };
    let prev = GENESIS;
    let i = 0;
    for (const line of readFileSync(path, "utf8").split("\n").filter(Boolean)) {
      i++;
      let e;
      try { e = JSON.parse(line); } catch { return { valid: false, entries: i - 1, brokenAt: i }; }
      const { hash, ...rest } = e;
      if (e.seq !== i || e.prev !== prev || sha(canonical(rest)) !== hash) return { valid: false, entries: i - 1, brokenAt: i };
      prev = hash;
    }
    return { valid: true, entries: i, brokenAt: null };
  }
}
