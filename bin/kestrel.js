#!/usr/bin/env node
import { join } from 'node:path';
import { homedir } from 'node:os';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { createAssistant } from '../src/app.js';
import { Session } from '../src/core/taint.js';
import { AuditLog } from '../src/core/audit.js';
import { generateConfig } from '../src/core/config.js';
import { detect } from '../src/core/hardware.js';
import { ALL_SKILLS } from '../src/skills/index.js';

const dataDir = process.env.KESTREL_HOME ?? join(homedir(), '.kestrel');
const [cmd, ...rest] = process.argv.slice(2);
const flag = (n) => rest.includes(n);
const positional = rest.filter((a) => !a.startsWith('--'));

async function cliApprover(req) {
  if (flag('--yes')) return true;
  if (!process.stdin.isTTY) return false; // fail-closed when nobody can answer
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  const a = await rl.question(`\n[approval] ${req.skill} ${JSON.stringify(req.args)}\n  reason: ${req.reason}\n  allow? (y/N) `);
  rl.close();
  return a.trim().toLowerCase() === 'y';
}

const usage = `kestrel <command>
  skills [--compact]            list skills and their permission tiers
  run <skill> '<json args>'     invoke a skill (add --yes to auto-approve prompts)
  audit verify|show             check the tamper-evident audit log
  config <answers.json>         generate a personalized config from questionnaire answers
  doctor                        detect hardware tier and model plan`;

try {
  switch (cmd) {
    case 'skills': {
      const app = createAssistant({ dataDir });
      if (flag('--compact')) console.log(JSON.stringify(app.registry.list({ profile: 'compact' }), null, 1));
      else for (const s of ALL_SKILLS) console.log(`${s.tier.padEnd(8)} ${s.pack.padEnd(8)} ${s.name.padEnd(22)} ${s.description}`);
      console.error(`\nschema tokens  full=${app.registry.schemaTokens('full')}  compact=${app.registry.schemaTokens('compact')}`);
      app.close(); break;
    }
    case 'run': {
      const [name, json = '{}'] = positional;
      const app = createAssistant({ dataDir, approver: cliApprover, roots: [process.cwd(), homedir()] });
      const env = await app.registry.invoke(name, JSON.parse(json), new Session());
      console.log(JSON.stringify(env, null, 2));
      app.close(); process.exitCode = env.ok ? 0 : 1; break;
    }
    case 'audit': {
      const path = join(dataDir, 'audit.jsonl');
      if (positional[0] === 'show') { for (const e of AuditLog.read(path)) console.log(`#${e.seq} ${e.ts} ${e.skill ?? e.attempted} allow=${e.decision.allow} ok=${e.outcome.ok} tainted=${e.tainted}`); break; }
      const v = AuditLog.verify(path);
      console.log(v.valid ? `OK: ${v.entries} entries, chain intact` : `TAMPERED: chain breaks at entry ${v.brokenAt}`);
      process.exitCode = v.valid ? 0 : 2; break;
    }
    case 'config': {
      const answers = JSON.parse(readFileSync(positional[0], 'utf8'));
      const cfg = generateConfig(answers, ALL_SKILLS, { totalMemGB: detect().tier === 'lite' ? 8 : 16 });
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(join(dataDir, 'config.json'), JSON.stringify(cfg, null, 2));
      console.log(JSON.stringify({ ...cfg, assistant: { ...cfg.assistant, persona: '[...]' } }, null, 2)); break;
    }
    case 'doctor': console.log(JSON.stringify(detect(), null, 2)); break;
    default: console.log(usage);
  }
} catch (e) {
  console.error('error:', e.message); process.exitCode = 1;
}
