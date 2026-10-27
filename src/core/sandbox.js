import { realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute, sep } from 'node:path';

// Filesystem containment: a path is usable only if its REAL location (symlinks resolved)
// is inside one of the user-approved roots.
export function resolveInRoots(p, roots) {
  const abs = resolve(p);
  let real;
  try { real = realpathSync(abs); } catch { throw new Error(`path does not exist: ${p}`); }
  for (const root of roots) {
    let rr;
    try { rr = realpathSync(root); } catch { continue; }
    const rel = relative(rr, real);
    if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel) && !rel.startsWith('..' + sep))) return real;
  }
  throw new Error(`path is outside the folders you allowed: ${p}`);
}
