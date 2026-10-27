import { ok, fail, ERR } from './envelope.js';
import { validate, applyDefaults, compactSchema, estimateTokens } from './schema.js';
import { scanInjection } from './taint.js';

const clip = (v) => (typeof v === 'string' && v.length > 200 ? v.slice(0, 200) + `…[${v.length} chars]` : v);

export class Registry {
  /**
   * @param {{policy:import('./permissions.js').Policy, audit?:import('./audit.js').AuditLog, ctx?:object}} opts
   * ctx is passed to every skill (memory store, exec runner, sandbox roots, clock...). Dependency
   * injection keeps skills pure and testable without touching the real OS.
   */
  constructor({ policy, audit = null, ctx = {} }) {
    this.policy = policy;
    this.audit = audit;
    this.ctx = ctx;
    this.skills = new Map();
  }

  register(...skills) {
    for (const s of skills) {
      if (this.skills.has(s.name)) throw new Error(`duplicate skill ${s.name}`);
      this.skills.set(s.name, s);
    }
    return this;
  }

  /** Tool list for the model. Profile "compact" shrinks schemas for small local models. */
  list({ profile = 'full', onlyEnabled = true } = {}) {
    return [...this.skills.values()]
      .filter((s) => !onlyEnabled || (this.policy.isEnabled(s.name) && s.tier !== 'blocked'))
      .map((s) => ({
        name: s.name,
        ...(profile === 'full' ? { description: s.description } : {}),
        inputSchema: profile === 'compact' ? compactSchema(s.inputSchema) : s.inputSchema,
      }));
  }

  schemaTokens(profile) { return estimateTokens(this.list({ profile })); }

  #redact(skill, args) {
    const out = {};
    for (const [k, v] of Object.entries(args ?? {})) out[k] = skill.redactArgs.includes(k) ? '[redacted]' : clip(v);
    return out;
  }

  #log(skill, args, session, decision, envelope, durationMs) {
    this.audit?.append({
      session: session.id,
      skill: skill?.name ?? null,
      args: skill ? this.#redact(skill, args) : null,
      tainted: session.tainted,
      decision,
      outcome: { ok: envelope.ok, code: envelope.error?.code ?? null },
      limits: envelope.limits,
      durationMs,
    });
  }

  async invoke(name, rawArgs, session) {
    const t0 = Date.now();
    const skill = this.skills.get(name);
    if (!skill) {
      const env = fail(name, ERR.UNKNOWN_SKILL, `no such skill: ${name}`);
      this.audit?.append({ session: session.id, skill: null, attempted: name, tainted: session.tainted, decision: { allow: false, reason: 'unknown skill' }, outcome: { ok: false, code: env.error.code }, limits: [], durationMs: 0 });
      return env;
    }

    const args = applyDefaults(skill.inputSchema, rawArgs ?? {});
    const errors = validate(skill.inputSchema, args);
    if (errors.length) {
      const env = fail(name, ERR.BAD_ARGS, errors.join('; '));
      this.#log(skill, rawArgs, session, { allow: false, reason: 'validation failed', prompted: false }, env, Date.now() - t0);
      return env;
    }

    const decision = await this.policy.decide(skill, args, session);
    if (!decision.allow) {
      const env = fail(name, ERR.DENIED, decision.reason);
      this.#log(skill, args, session, decision, env, Date.now() - t0);
      return env;
    }

    let env;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), skill.timeoutMs);
    try {
      const out = await Promise.race([
        skill.run(args, { ...this.ctx, signal: ac.signal, session }),
        new Promise((_, rej) => ac.signal.addEventListener('abort', () => rej(Object.assign(new Error('timed out'), { code: ERR.TIMEOUT })))),
      ]);
      env = ok(name, out.result, { evidence: out.evidence, limits: out.limits });
      if (skill.returnsUntrusted || out.untrusted) {
        session.markUntrusted(name);
        const scan = scanInjection(JSON.stringify(out.result));
        env.untrusted = true;
        if (scan.suspicious) env.limits = [...env.limits, `possible prompt injection detected in result: ${scan.hits.join(' | ')}`];
      }
    } catch (e) {
      env = fail(name, e.code === ERR.TIMEOUT ? ERR.TIMEOUT : ERR.FAILED, e.message);
    } finally {
      clearTimeout(timer);
    }
    this.#log(skill, args, session, decision, env, Date.now() - t0);
    return env;
  }
}
