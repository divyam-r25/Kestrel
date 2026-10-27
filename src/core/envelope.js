// Every skill returns an envelope: result + the evidence behind it + what it could NOT verify.
// (Pattern borrowed from REA: results carry evidence and limitations, not just an answer.)

/** @typedef {{type:string, ref:string, detail?:string}} Evidence */

export const ok = (skill, result, { evidence = [], limits = [] } = {}) =>
  ({ ok: true, skill, result, evidence, limits });

export const fail = (skill, code, message, { evidence = [], limits = [] } = {}) =>
  ({ ok: false, skill, error: { code, message }, evidence, limits });

export const ERR = Object.freeze({
  UNKNOWN_SKILL: "UNKNOWN_SKILL",
  DISABLED: "SKILL_DISABLED",
  BAD_ARGS: "INVALID_ARGUMENTS",
  DENIED: "PERMISSION_DENIED",
  TIMEOUT: "TIMEOUT",
  FAILED: "SKILL_FAILED",
});
