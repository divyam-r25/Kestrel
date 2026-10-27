import { join } from 'node:path';
import { homedir } from 'node:os';
import { Policy } from './core/permissions.js';
import { Registry } from './core/registry.js';
import { AuditLog } from './core/audit.js';
import { MemoryStore } from './core/memory.js';
import { exec } from './core/exec.js';
import { ALL_SKILLS } from './skills/index.js';

/** Wire everything together. All side-effecting dependencies are injectable for tests. */
export function createAssistant({ dataDir, config = null, roots = [homedir()], approver = null, clock = () => Date.now(), execImpl = exec, platform } = {}) {
  const audit = new AuditLog(join(dataDir, 'audit.jsonl'));
  const memory = new MemoryStore(join(dataDir, 'memory.db'), { clock });
  const policy = new Policy({
    enabledSkills: config?.skills.enabled ?? null,
    autoApprove: config?.skills.autoApprove ?? [],
    unlockedBlocked: config?.skills.unlockedBlocked ?? [],
    approver,
  });
  const registry = new Registry({ policy, audit, ctx: { memory, exec: execImpl, roots, clock, platform } });
  registry.register(...ALL_SKILLS);
  return { registry, audit, memory, policy, close: () => memory.close() };
}
