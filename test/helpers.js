import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAssistant } from '../src/app.js';

export function tmp() {
  const dir = mkdtempSync(join(tmpdir(), 'kestrel-'));
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}
export function makeApp(over = {}) {
  const t = tmp();
  const app = createAssistant({ dataDir: join(t.dir, 'data'), roots: [t.dir], ...over });
  return { ...app, dir: t.dir, cleanup: () => { app.close(); t.cleanup(); } };
}
