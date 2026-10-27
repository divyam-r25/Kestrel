// Permission policy. Fail-closed: if approval is needed and no approver exists, the call is denied.
//
// Rules (first match wins):
//  1. skill not enabled in config                          -> deny
//  2. tier=blocked: needs explicit unlock AND per-call approval
//  3. session tainted (untrusted content in context):
//       any skill with side effects or network access -> ALWAYS ask the user (auto-approve ignored)
//  4. tier=ask: auto-approve only if the user whitelisted it AND the session is clean, else ask
//  5. tier=safe: allow
export class Policy {
  constructor({ enabledSkills = null, autoApprove = [], unlockedBlocked = [], approver = null } = {}) {
    this.enabled = enabledSkills ? new Set(enabledSkills) : null;
    this.autoApprove = new Set(autoApprove);
    this.unlocked = new Set(unlockedBlocked);
    this.approver = approver;
  }

  isEnabled(name) { return this.enabled === null || this.enabled.has(name); }

  async #ask(skill, args, session, reason) {
    if (!this.approver) return { allow: false, reason: `${reason}; no approver available (fail-closed)`, prompted: false };
    const approved = await this.approver({ skill: skill.name, args, reason, tainted: session.tainted, sources: [...session.sources] });
    return approved
      ? { allow: true, reason: `${reason}; approved by user`, prompted: true }
      : { allow: false, reason: `${reason}; user declined`, prompted: true };
  }

  async decide(skill, args, session) {
    if (!this.isEnabled(skill.name)) return { allow: false, reason: "skill not enabled", prompted: false };

    if (skill.tier === "blocked") {
      if (!this.unlocked.has(skill.name)) return { allow: false, reason: "blocked tier and not unlocked", prompted: false };
      return this.#ask(skill, args, session, "blocked-tier skill unlocked, per-call approval required");
    }

    const risky = skill.sideEffects !== "none" || skill.network;
    if (session.tainted && risky) {
      return this.#ask(skill, args, session, `untrusted content in context (${session.sources.join(", ")}) and skill has side effects`);
    }

    if (skill.tier === "ask") {
      if (this.autoApprove.has(skill.name) && !session.tainted) return { allow: true, reason: "user auto-approved, clean session", prompted: false };
      return this.#ask(skill, args, session, "ask-tier skill");
    }
    return { allow: true, reason: "safe tier", prompted: false };
  }
}
