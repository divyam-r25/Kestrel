export const TIERS = Object.freeze(["safe", "ask", "blocked"]);
export const SIDE_EFFECTS = Object.freeze(["none", "memory", "fs-write", "process", "network"]);
export const PACKS = Object.freeze(["core", "dev", "student"]);

/**
 * Declare a skill. A skill is a typed, permission-tiered tool.
 * - tier: safe (read-only) | ask (changes things; needs approval) | blocked (off unless user unlocks)
 * - sideEffects: what it can change. Anything other than "none" is treated as risky when the
 *   session is tainted by untrusted content (prompt-injection defence).
 * - network: true if data can leave the device.
 * - returnsUntrusted: result contains attacker-controllable text (web page, file body, OCR...).
 * - redactArgs: argument names never written to the audit log in clear text.
 */
export function defineSkill(def) {
  const errs = [];
  if (!/^[a-z]+(\.[a-z_]+)+$/.test(def.name ?? "")) errs.push("name must look like pack.action");
  if (!TIERS.includes(def.tier)) errs.push(`tier must be one of ${TIERS}`);
  if (!PACKS.includes(def.pack)) errs.push(`pack must be one of ${PACKS}`);
  if (typeof def.description !== "string" || def.description.length < 10) errs.push("description required");
  if (typeof def.run !== "function") errs.push("run() required");
  if (def.inputSchema?.type !== "object") errs.push("inputSchema must be an object schema");
  const sideEffects = def.sideEffects ?? "none";
  if (!SIDE_EFFECTS.includes(sideEffects)) errs.push(`sideEffects must be one of ${SIDE_EFFECTS}`);
  if (def.tier === "safe" && ["fs-write", "process"].includes(sideEffects)) errs.push("a safe-tier skill cannot have fs-write/process side effects");
  if (errs.length) throw new Error(`Invalid skill "${def.name}": ${errs.join("; ")}`);
  return Object.freeze({
    network: false,
    returnsUntrusted: false,
    redactArgs: [],
    timeoutMs: 10_000,
    ...def,
    sideEffects,
  });
}
