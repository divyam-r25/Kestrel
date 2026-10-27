import { execFile } from 'node:child_process';

// Single choke point for spawning processes: never a shell, bounded time, bounded output.
export function exec(file, args = [], { cwd, timeoutMs = 8000, maxBytes = 1_000_000, env } = {}) {
  return new Promise((resolve, reject) => {
    execFile(file, args, { cwd, timeout: timeoutMs, maxBuffer: maxBytes, windowsHide: true, env: { ...process.env, ...env }, shell: false },
      (err, stdout, stderr) => {
        if (err && err.code === 'ENOENT') return reject(Object.assign(new Error(`${file} not found`), { code: 'ENOENT' }));
        if (err && err.killed) return reject(new Error(`${file} timed out`));
        resolve({ stdout: String(stdout), stderr: String(stderr), code: err ? (typeof err.code === 'number' ? err.code : 1) : 0 });
      });
  });
}
