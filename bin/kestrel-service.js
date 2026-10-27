#!/usr/bin/env node
/**
 * Kestrel core service — started by the Tauri desktop shell.
 * Speaks JSON-RPC 2.0 over stdio. Each line in = one JSON message.
 * Each line out = one JSON response or notification.
 *
 * Methods exposed:
 *   skills.list           -> [{name, tier, description}]
 *   chat.send {message}   -> streams token/tool/final events via notifications, then returns final text
 *   chat.cancel {}        -> cancels the current run
 *   config.get {}         -> current config
 *   config.update {patch} -> merge-patch the local config and persist
 *   audit.list {limit?}   -> last N audit entries
 *   audit.verify {}       -> {valid, entries, brokenAt}
 *   memory.list {query?}  -> memories
 *   memory.delete {id}    -> {deleted}
 *   memory.export {}      -> [{id, kind, text, source, created}]
 *
 * Events pushed from server to client:
 *   chat.token {text}     -> streaming token
 *   chat.tool  {name, ok} -> tool call result
 *   chat.final {text}     -> final answer
 *   approval.request {skill, args, reason, tainted, sources} -> awaits approval.respond
 *
 * Client -> server replies:
 *   approval.respond {id, approved} -> resolves the pending approval.request
 */

import { join } from 'node:path';
import { homedir } from 'node:os';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createAssistant } from '../src/app.js';
import { Session } from '../src/core/taint.js';
import { AuditLog } from '../src/core/audit.js';
import { ALL_SKILLS } from '../src/skills/index.js';
import { runAgent } from '../src/agent/loop.js';
import { OllamaProvider } from '../src/agent/providers.js';
import { JsonRpcServer } from '../src/ipc/server.js';

const dataDir = process.env.KESTREL_HOME ?? join(homedir(), '.kestrel');
mkdirSync(dataDir, { recursive: true });

// Load config if it exists
const configPath = join(dataDir, 'config.json');
const config = existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf8')) : null;

const rpc = new JsonRpcServer();

// The approver function sends approval.request to the UI and waits for the reply
const approver = (req) => rpc.request('approval.request', req).then((r) => !!r?.approved);

const app = createAssistant({
  dataDir,
  config,
  roots: [homedir()],
  approver,
});

// Current cancellation controller for the running chat
let currentAC = null;
let currentSession = new Session();

const provider = new OllamaProvider({
  model: config?.hardware?.llm?.sizeClass ? guessModel(config.hardware) : 'llama3.1:8b',
});

function guessModel(hardware) {
  const { tier } = hardware;
  if (tier === 'lite') return 'llama3.2:1b';
  if (tier === 'standard') return 'llama3.1:8b';
  return 'llama3.1:8b';
}

// ── Methods ──────────────────────────────────────────────────────────────────

rpc.on('skills.list', () =>
  ALL_SKILLS.map((s) => ({ name: s.name, tier: s.tier, pack: s.pack, description: s.description }))
);

rpc.on('chat.send', async ({ message, resetSession }) => {
  if (resetSession || !currentSession) currentSession = new Session();

  // Cancel any running generation
  if (currentAC) { currentAC.abort(); currentAC = null; }
  currentAC = new AbortController();
  const ac = currentAC;

  const systemPrompt = config?.assistant?.persona ?? 'You are a local AI assistant. Answer briefly.';
  const profile = config?.hardware?.schemaProfile ?? 'full';

  try {
    const result = await runAgent({
      provider,
      registry: app.registry,
      session: currentSession,
      userText: message,
      systemPrompt,
      profile,
      maxSteps: 8,
      onEvent: (ev) => {
        if (ac.signal.aborted) return;
        rpc.notify(`chat.${ev.type}`, ev);
      },
    });
    if (!ac.signal.aborted) rpc.notify('chat.final', { text: result.text });
    return { text: result.text };
  } catch (e) {
    if (!ac.signal.aborted) rpc.notify('chat.error', { message: e.message });
    throw e;
  } finally {
    if (currentAC === ac) currentAC = null;
  }
});

rpc.on('chat.cancel', () => {
  if (currentAC) { currentAC.abort(); currentAC = null; }
  return { cancelled: true };
});

rpc.on('config.get', () => config ?? {});

rpc.on('config.update', ({ patch }) => {
  const current = existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf8')) : {};
  // Security: never accept power-granting fields from the UI directly without the user explicitly enabling them in settings.
  // Only allow: assistant.tone, assistant.name, privacy.mode, hardware.tier
  const safe = { ...current };
  if (patch?.assistant?.tone) safe.assistant = { ...safe.assistant, tone: patch.assistant.tone };
  if (patch?.assistant?.name) safe.assistant = { ...safe.assistant, name: patch.assistant.name };
  if (patch?.privacy?.mode) safe.privacy = { ...safe.privacy, mode: patch.privacy.mode };
  writeFileSync(configPath, JSON.stringify(safe, null, 2));
  return { ok: true };
});

rpc.on('audit.list', ({ limit = 50 } = {}) => {
  const entries = AuditLog.read(join(dataDir, 'audit.jsonl'));
  return entries.slice(-limit).reverse();
});

rpc.on('audit.verify', () => AuditLog.verify(join(dataDir, 'audit.jsonl')));

rpc.on('memory.list', ({ query = '', limit = 20 } = {}) => {
  if (query) return app.memory.recall(query, { limit });
  // Return all (up to limit) via an empty FTS query workaround
  return app.memory.recall('*', { limit }).concat(
    app.memory.recall('the', { limit }) // grab more
  ).filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i).slice(0, limit);
});

rpc.on('memory.delete', ({ id }) => ({ deleted: app.memory.forget(id) }));

rpc.on('memory.export', () => {
  // Export all memories — use recall with broad terms as a workaround (proper export needs raw DB query)
  const terms = ['the', 'a', 'is', 'my', 'I', 'was', 'for'];
  const all = [];
  for (const t of terms) {
    for (const m of app.memory.recall(t, { limit: 100 })) {
      if (!all.find((x) => x.id === m.id)) all.push(m);
    }
  }
  return all;
});

// Start listening on stdio
rpc.listen(process.stdin, process.stdout);
process.stderr.write('[kestrel-core] started\n');
