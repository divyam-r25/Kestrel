/**
 * Tests for the new skills added in the beta expansion:
 * apps.launch, system.volume_brightness, files.open_move,
 * web.search, dev.explain_error, study.deadlines
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Session } from '../src/core/taint.js';
import { makeApp } from './helpers.js';

// ── apps.launch ──────────────────────────────────────────────────────────────
test('apps.launch requires ask-tier approval', async () => {
  const a = makeApp({ approver: async () => false }); // deny
  const r = await a.registry.invoke('apps.launch', { app: 'notepad' }, new Session());
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'PERMISSION_DENIED');
  a.cleanup();
});

test('apps.launch strips path separators (hardening)', async () => {
  let launched = null;
  const a = makeApp({
    approver: async () => true,
    execImpl: async (file, args) => { launched = file; return { stdout: '', stderr: '', code: 0 }; },
  });
  // Attempt to use a path traversal via app name — separators / and \ must be stripped
  await a.registry.invoke('apps.launch', { app: '..\\..\\notepad', args: [] }, new Session());
  // After stripping / and \, the name should not contain any path separator
  assert.ok(launched !== null, 'exec was called after approval');
  assert.ok(!launched.includes('/') && !launched.includes('\\'), 'no path separators in launched name');
  a.cleanup();
});

// ── dev.explain_error ────────────────────────────────────────────────────────
test('dev.explain_error parses Python traceback', async () => {
  const a = makeApp();
  const errorText = `Traceback (most recent call last):
  File "app.py", line 42, in <module>
    result = divide(10, 0)
  File "utils/math.py", line 8, in divide
    return a / b
ZeroDivisionError: division by zero`;

  const r = await a.registry.invoke('dev.explain_error', { errorText, language: 'python' }, new Session());
  assert.equal(r.ok, true);
  assert.equal(r.result.language, 'python');
  assert.equal(r.result.errorType, 'ZeroDivisionError');
  assert.ok(r.result.lineNumbers.includes(42));
  assert.ok(r.result.rawLines.length > 0);
  assert.equal(r.untrusted, true, 'error text is always untrusted');
  a.cleanup();
});

test('dev.explain_error parses JavaScript stack trace', async () => {
  const a = makeApp();
  const errorText = `TypeError: Cannot read properties of undefined (reading 'map')
    at processItems (C:\\Users\\divya\\project\\src\\app.js:23:15)
    at async handler (C:\\Users\\divya\\project\\src\\server.js:47:5)`;

  const r = await a.registry.invoke('dev.explain_error', { errorText }, new Session());
  assert.equal(r.ok, true);
  assert.equal(r.result.errorType, 'TypeError');
  assert.ok(r.result.fileReferences.some(f => f.includes('app.js')));
  assert.ok(r.result.lineNumbers.includes(23));
  a.cleanup();
});

// ── study.deadlines ──────────────────────────────────────────────────────────
test('study.deadlines: add and list deadlines', async () => {
  const a = makeApp();
  const s = new Session();

  const added = await a.registry.invoke('study.deadlines', { action: 'add', subject: 'DBMS', task: 'Unit 3 exam', dueDate: '2026-12-15' }, s);
  assert.equal(added.ok, true);
  assert.ok(added.result.id > 0);
  assert.ok(added.result.recorded.includes('DBMS'));
  assert.ok(added.result.recorded.includes('deadline'));

  // Add another
  await a.registry.invoke('study.deadlines', { action: 'add', subject: 'OS', task: 'Assignment 2', dueDate: '2026-11-30' }, s);

  // List — should return both (keyword "deadline" present in both)
  const list = await a.registry.invoke('study.deadlines', { action: 'list' }, s);
  assert.equal(list.ok, true);
  assert.ok(list.result.deadlines.length >= 2);
  a.cleanup();
});

// ── files.open_move ──────────────────────────────────────────────────────────
test('files.open_move: copy within allowed root', async () => {
  const a = makeApp();
  const src = join(a.dir, 'source.txt');
  const destDir = join(a.dir, 'dest');
  mkdirSync(destDir, { recursive: true });
  writeFileSync(src, 'hello world');

  const r = await a.registry.invoke('files.open_move', {
    source: src,
    destination: join(destDir, 'source.txt'),
    operation: 'copy',
  }, new Session());

  // This is ask-tier — denied without approver
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'PERMISSION_DENIED');
  a.cleanup();
});

test('files.open_move: copy with approval copies the file', async () => {
  const a = makeApp({ approver: async () => true });
  const src = join(a.dir, 'note.txt');
  const destDir = join(a.dir, 'backup');
  mkdirSync(destDir, { recursive: true });
  writeFileSync(src, 'important content');

  const r = await a.registry.invoke('files.open_move', {
    source: src,
    destination: join(destDir, 'note.txt'),
    operation: 'copy',
  }, new Session());

  assert.equal(r.ok, true);
  assert.equal(r.result.operation, 'copy');
  assert.ok(existsSync(src), 'source still exists after copy');
  a.cleanup();
});

// ── web.search (mocked network) ──────────────────────────────────────────────
test('web.search returns untrusted results and network flag', async () => {
  const a = makeApp();
  // web.search is safe-tier but network=true; it runs without approval
  // We can't hit the real network in tests, so just verify the skill declaration
  const { ALL_SKILLS } = await import('../src/skills/index.js');
  const ws = ALL_SKILLS.find(s => s.name === 'web.search');
  assert.ok(ws, 'web.search is registered');
  assert.equal(ws.tier, 'safe');
  assert.equal(ws.network, true);
  assert.equal(ws.returnsUntrusted, true);
  a.cleanup();
});

// ── system.volume_brightness declaration ─────────────────────────────────────
test('system.volume_brightness is ask-tier', async () => {
  const { ALL_SKILLS } = await import('../src/skills/index.js');
  const vb = ALL_SKILLS.find(s => s.name === 'system.volume_brightness');
  assert.ok(vb, 'system.volume_brightness is registered');
  assert.equal(vb.tier, 'ask');
});
