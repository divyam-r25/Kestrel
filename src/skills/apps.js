import { defineSkill } from '../core/skill.js';
import { resolveInRoots } from '../core/sandbox.js';

// ── apps.launch ─────────────────────────────────────────────────────────────
// Safe-tier: launching a known app is a low-blast-radius action (user-visible).
const SAFE_APPS = new Set([
  'notepad', 'calc', 'mspaint', 'explorer', 'wordpad',
  'code', 'code.cmd',             // VS Code
  'firefox', 'chrome', 'msedge', 'brave',
  'winword', 'excel', 'powerpnt', // Office
  'winget', 'wt',                 // Windows Terminal
]);

export const appsLaunch = defineSkill({
  name: 'apps.launch', pack: 'core', tier: 'ask', sideEffects: 'process',
  description: 'Launch an application by executable name. Asks for approval before running.',
  inputSchema: {
    type: 'object', required: ['app'],
    properties: {
      app: { type: 'string', minLength: 1, maxLength: 100, description: 'Executable name, e.g. "notepad", "code"' },
      args: { type: 'array', maxItems: 16, items: { type: 'string', maxLength: 500 }, default: [] },
    },
  },
  async run({ app, args }, ctx) {
    // Strip path separators – we only allow bare names so a hostile model cannot craft "../../something"
    const safe = app.replace(/[/\\]/g, '');
    const r = await ctx.exec(safe, args ?? [], { timeoutMs: 5_000 });
    return {
      result: { launched: safe, args, exitCode: r.code },
      evidence: [{ type: 'process', ref: safe }],
      limits: ['app must be on PATH; arguments are not sanitised'],
    };
  },
});
