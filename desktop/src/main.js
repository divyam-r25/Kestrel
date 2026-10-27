/**
 * Kestrel Desktop App — Main entry point
 * Handles:
 *  - JSON-RPC IPC with the core Node.js service (via Tauri sidecar)
 *  - Chat view with streaming tokens + tool pills
 *  - Approval dialog (renders when core service requests approval)
 *  - Audit viewer with chain verify
 *  - Memory manager (list, search, delete, export)
 *  - Settings panel
 *  - Mic button (push-to-talk placeholder for voice)
 */

import '../src/style.css';

// ── Tauri IPC bridge ─────────────────────────────────────────────────────────
// When running inside Tauri, we use the Tauri sidecar + command API.
// In dev/browser mode, we fall back to a mock provider.

let rpcSend;      // (method, params) => Promise<result>
let rpcOnEvent;   // (handler: (event) => void) => void
let _eventHandler = null;

async function initRPC() {
  try {
    // Try to load Tauri API (available when running inside Tauri)
    const { invoke } = await import('@tauri-apps/api/core');
    const { listen } = await import('@tauri-apps/api/event');

    rpcSend = async (method, params) => {
      return invoke('rpc_call', { method, params: JSON.stringify(params ?? {}) })
        .then(r => JSON.parse(r));
    };
    rpcOnEvent = (handler) => {
      _eventHandler = handler;
      listen('kestrel-event', (e) => handler(e.payload));
    };
    console.log('[kestrel] Tauri IPC ready');
  } catch {
    // Not in Tauri — use mock for development/demo
    console.warn('[kestrel] Tauri not available, using mock RPC');
    setupMockRPC();
  }
}

function setupMockRPC() {
  const mockMemories = [
    { id: 1, kind: 'fact', text: 'DBMS exam is on December 15', source: 'user', created: Date.now() - 86400000 },
    { id: 2, kind: 'preference', text: 'I prefer dark mode and short answers', source: 'user', created: Date.now() - 172800000 },
    { id: 3, kind: 'note', text: '[DBMS] Normalization — 1NF removes repeating groups, 2NF removes partial dependencies', source: 'user', created: Date.now() - 3600000 },
  ];

  const mockAudit = [
    { seq: 1, ts: new Date(Date.now()-3600000).toISOString(), skill: 'files.search', decision: { allow: true, prompted: false }, outcome: { ok: true }, tainted: false, durationMs: 42 },
    { seq: 2, ts: new Date(Date.now()-3000000).toISOString(), skill: 'memory.remember', decision: { allow: true, prompted: false }, outcome: { ok: true }, tainted: false, durationMs: 8 },
    { seq: 3, ts: new Date(Date.now()-2400000).toISOString(), skill: 'files.read_text', decision: { allow: true, prompted: false }, outcome: { ok: true }, tainted: true, durationMs: 15 },
    { seq: 4, ts: new Date(Date.now()-1800000).toISOString(), skill: 'memory.remember', decision: { allow: false, reason: 'untrusted content in context; user declined', prompted: true }, outcome: { ok: false }, tainted: true, durationMs: 0 },
    { seq: 5, ts: new Date(Date.now()-600000).toISOString(), skill: 'reminders.add', decision: { allow: true, prompted: false }, outcome: { ok: true }, tainted: false, durationMs: 5 },
  ];

  let nextEventId = 100;

  rpcSend = async (method, params) => {
    await new Promise(r => setTimeout(r, 80)); // simulate latency
    switch (method) {
      case 'skills.list':
        return [
          { name: 'system.info', tier: 'safe', pack: 'core', description: 'OS, CPU, RAM, uptime' },
          { name: 'files.search', tier: 'safe', pack: 'core', description: 'Find files by name' },
          { name: 'files.read_text', tier: 'safe', pack: 'core', description: 'Read a text file' },
          { name: 'memory.remember', tier: 'safe', pack: 'core', description: 'Save a fact to local memory' },
          { name: 'memory.recall', tier: 'safe', pack: 'core', description: 'Search local memory' },
          { name: 'reminders.add', tier: 'safe', pack: 'core', description: 'Create a timed reminder' },
          { name: 'reminders.due', tier: 'safe', pack: 'core', description: 'List due reminders' },
          { name: 'apps.launch', tier: 'ask', pack: 'core', description: 'Launch an application' },
          { name: 'web.search', tier: 'safe', pack: 'core', description: 'DuckDuckGo search' },
          { name: 'dev.port_lookup', tier: 'safe', pack: 'dev', description: 'Find what process uses a port' },
          { name: 'dev.git_summary', tier: 'safe', pack: 'dev', description: 'Git branch + recent commits' },
          { name: 'dev.explain_error', tier: 'safe', pack: 'dev', description: 'Parse error/stack trace' },
          { name: 'study.notes_add', tier: 'safe', pack: 'student', description: 'Save a study note' },
          { name: 'study.notes_search', tier: 'safe', pack: 'student', description: 'Search notes' },
          { name: 'study.deadlines', tier: 'safe', pack: 'student', description: 'Track deadlines' },
          { name: 'shell.run', tier: 'blocked', pack: 'core', description: 'Run executable (off by default)' },
        ];
      case 'chat.send': {
        // Simulate streaming
        const steps = [
          { type: 'token', text: 'Let me search ' },
          { type: 'token', text: 'your files for ' },
          { type: 'token', text: 'that...\n\n' },
          { type: 'tool', name: 'files.search', ok: true },
          { type: 'token', text: 'Found 3 matching files in your DBMS folder:\n- DBMS_unit1.pdf\n- DBMS_unit2.pdf\n- dbms-lab-record.docx\n\nThe lab record was last modified 3 days ago.' },
          { type: 'final', text: 'Found 3 matching files in your DBMS folder:\n- DBMS_unit1.pdf\n- DBMS_unit2.pdf\n- dbms-lab-record.docx\n\nThe lab record was last modified 3 days ago.' },
        ];
        let delay = 300;
        for (const s of steps) {
          setTimeout(() => _eventHandler?.(s), delay);
          delay += s.type === 'token' ? 180 : 400;
        }
        return { text: 'Found 3 matching files.' };
      }
      case 'chat.cancel': return { cancelled: true };
      case 'config.get': return { assistant: { name: 'Nova', tone: 'concise' }, privacy: { mode: 'offline', cloudModelAllowed: false }, hardware: { tier: 'standard' } };
      case 'config.update': return { ok: true };
      case 'audit.list': return mockAudit.slice(-(params?.limit ?? 50)).reverse();
      case 'audit.verify': return { valid: true, entries: mockAudit.length, brokenAt: null };
      case 'memory.list': return mockMemories;
      case 'memory.delete': {
        const idx = mockMemories.findIndex(m => m.id === params.id);
        if (idx !== -1) mockMemories.splice(idx, 1);
        return { deleted: idx !== -1 };
      }
      case 'memory.export': return mockMemories;
      default: throw new Error(`Unknown method: ${method}`);
    }
  };
  rpcOnEvent = (handler) => { _eventHandler = handler; };
}

// ── State ────────────────────────────────────────────────────────────────────
const state = {
  view: 'chat',          // 'chat' | 'audit' | 'memory' | 'settings' | 'skills'
  messages: [],
  isThinking: false,
  auditEntries: [],
  auditValid: null,
  memories: [],
  skills: [],
  config: {},
  pendingApproval: null, // { skill, args, reason, tainted, resolve }
  recording: false,
};

// ── Render ───────────────────────────────────────────────────────────────────
function render() {
  document.getElementById('app').innerHTML = buildShell();
  bindEvents();
}

function buildShell() {
  return `
    ${buildApprovalOverlay()}
    <div class="titlebar">
      <div class="titlebar-logo">
        <span class="titlebar-logo-icon">🦅</span>
        <span>Kestrel</span>
      </div>
      <div class="titlebar-status">
        <span class="status-dot"></span>
        <span>${state.config?.assistant?.name ?? 'assistant'} · ${state.config?.hardware?.tier ?? 'auto'} tier · ${state.config?.privacy?.mode ?? 'offline'}</span>
      </div>
      <div class="titlebar-actions">
        <button class="icon-btn" id="btn-new-chat" title="New conversation">↺</button>
      </div>
    </div>
    <div class="shell">
      ${buildSidebar()}
      <div class="content">
        ${buildView()}
      </div>
    </div>
  `;
}

function buildSidebar() {
  const navItem = (view, icon, label) =>
    `<button class="nav-item${state.view === view ? ' active' : ''}" data-view="${view}" id="nav-${view}">
      <span class="nav-icon">${icon}</span> ${label}
    </button>`;
  return `
    <div class="sidebar">
      <div class="sidebar-nav">
        <div class="nav-section-label">Assistant</div>
        ${navItem('chat', '💬', 'Chat')}
        <div class="nav-section-label">History</div>
        ${navItem('audit', '📋', 'Audit Log')}
        ${navItem('memory', '🧠', 'Memory')}
        <div class="nav-section-label">Config</div>
        ${navItem('skills', '🔧', 'Skills')}
        ${navItem('settings', '⚙️', 'Settings')}
      </div>
      <div class="sidebar-footer">
        <button class="mic-btn${state.recording ? ' recording' : ''}" id="btn-mic">
          ${state.recording ? '🔴 Recording…' : '🎙️ Push to talk'}
        </button>
      </div>
    </div>
  `;
}

function buildView() {
  switch (state.view) {
    case 'chat':     return buildChatView();
    case 'audit':    return buildAuditView();
    case 'memory':   return buildMemoryView();
    case 'skills':   return buildSkillsView();
    case 'settings': return buildSettingsView();
    default:         return buildChatView();
  }
}

// ── Chat view ────────────────────────────────────────────────────────────────
function buildChatView() {
  const msgs = state.messages.map(buildMessage).join('');
  const thinking = state.isThinking ? `
    <div class="message animate-in">
      <div class="message-avatar">🦅</div>
      <div class="thinking">
        <div class="thinking-dots">
          <div class="thinking-dot"></div>
          <div class="thinking-dot"></div>
          <div class="thinking-dot"></div>
        </div>
        <span>thinking…</span>
      </div>
    </div>` : '';

  const emptyState = state.messages.length === 0 ? `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;color:var(--text-3);">
      <div style="font-size:3rem">🦅</div>
      <div style="font-size:1rem;font-weight:600;color:var(--text-2)">Ask ${state.config?.assistant?.name ?? 'Kestrel'} anything</div>
      <div style="font-size:0.85rem;max-width:320px;text-align:center">Search files, remember facts, check reminders, explain errors, look up ports…</div>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;justify-content:center;margin-top:0.5rem">
        ${['Find my DBMS notes', 'What\'s on port 3000?', 'Remind me to submit lab at 5 PM', 'Search for git summary'].map(s =>
          `<button class="suggest-btn" data-text="${s}" style="background:var(--bg-elevated);border:1px solid var(--border);color:var(--text-2);padding:0.4rem 0.8rem;border-radius:999px;font-size:0.8rem;cursor:pointer;">${s}</button>`
        ).join('')}
      </div>
    </div>` : '';

  return `
    <div class="chat-view">
      <div class="messages" id="messages-list">
        ${emptyState}
        ${msgs}
        ${thinking}
      </div>
      <div class="input-bar">
        <div class="input-wrap">
          <textarea class="chat-input" id="chat-input" rows="1"
            placeholder="Message ${state.config?.assistant?.name ?? 'Kestrel'}… (Shift+Enter for new line)"
            ${state.isThinking ? 'disabled' : ''}></textarea>
        </div>
        ${state.isThinking
          ? `<button class="send-btn" id="btn-cancel" style="background:var(--red)">⏹ Stop</button>`
          : `<button class="send-btn" id="btn-send" ${state.isThinking ? 'disabled' : ''}>Send ↵</button>`}
      </div>
      <div style="padding:0.25rem 1rem 0.5rem;display:flex;justify-content:space-between;align-items:center">
        <div class="input-hint">🔒 Local model · nothing sent to cloud · <a href="#" id="link-audit" style="color:var(--accent);text-decoration:none">view audit log</a></div>
        ${state.messages.length > 0 ? `<button class="icon-btn" id="btn-clear-chat" style="font-size:0.75rem;color:var(--text-3)">Clear</button>` : ''}
      </div>
    </div>
  `;
}

function buildMessage(msg) {
  const isUser = msg.role === 'user';
  const time = new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let content = '';
  if (msg.type === 'tool') {
    content = `<div class="tool-pill ${msg.ok ? 'ok' : 'fail'}">${msg.ok ? '✔' : '✖'} ${msg.name}</div>`;
    if (msg.limits?.length) content += `<div style="font-size:0.72rem;color:var(--text-3);margin-top:0.3rem">⚠ ${msg.limits.join(' · ')}</div>`;
  } else {
    const text = (msg.text ?? '').replace(/\n/g, '<br>');
    content = `<div class="message-bubble">${text}</div>`;
    if (msg.evidence?.length) {
      content += `<div class="evidence-chips">${msg.evidence.map(e => `<span class="evidence-chip">📎 ${e.ref?.split(/[/\\]/).at(-1) ?? e.type}</span>`).join('')}</div>`;
    }
  }

  return `
    <div class="message ${isUser ? 'user' : 'assistant'} animate-in">
      <div class="message-avatar">${isUser ? '👤' : '🦅'}</div>
      <div class="message-body">
        ${content}
        <div class="message-meta">${time}${msg.tainted ? ' · <span style="color:var(--amber)">⚠ tainted session</span>' : ''}</div>
      </div>
    </div>`;
}

// ── Audit view ───────────────────────────────────────────────────────────────
function buildAuditView() {
  const verifyBanner = state.auditValid === null ? '' :
    `<div class="verify-banner ${state.auditValid ? 'verify-ok' : 'verify-fail'}">
      ${state.auditValid ? '✔ Chain intact — audit log has not been tampered with' : '✖ TAMPERED — the audit chain is broken!'}
    </div>`;

  const entries = state.auditEntries.map(e => {
    const t = new Date(e.ts).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
    const tier = e.decision?.allow ? (e.decision?.prompted ? 'warn' : 'safe') : 'danger';
    return `<div class="audit-entry">
      <div class="audit-seq">#${e.seq}</div>
      <div>
        <div class="audit-skill" style="color:var(--cyan)">${e.skill ?? e.attempted ?? '—'}</div>
        <div class="audit-meta">${t} · ${e.decision?.reason ?? ''}</div>
      </div>
      <div class="audit-outcome">
        <span class="badge badge-${tier}">${e.decision?.allow ? (e.decision?.prompted ? 'approved' : 'auto') : 'denied'}</span>
        <div style="font-size:0.72rem;color:var(--text-3);margin-top:0.2rem">${e.durationMs ?? 0}ms</div>
      </div>
    </div>`;
  }).join('');

  return `
    <div class="chat-view">
      <div class="view-header">
        <div class="view-title">📋 Audit Log</div>
        <div style="display:flex;gap:0.5rem">
          <button class="icon-btn" id="btn-verify-audit" title="Verify chain integrity">🔍 Verify</button>
          <button class="icon-btn" id="btn-refresh-audit" title="Refresh">↺</button>
        </div>
      </div>
      ${verifyBanner}
      <div class="audit-list">${entries || '<div style="padding:2rem;text-align:center;color:var(--text-3)">No audit entries yet.</div>'}</div>
    </div>`;
}

// ── Memory view ──────────────────────────────────────────────────────────────
function buildMemoryView() {
  const kindIcon = { fact: '💡', preference: '❤️', note: '📝' };
  const cards = state.memories.map(m => `
    <div class="memory-card animate-in" data-id="${m.id}">
      <div class="memory-icon">${kindIcon[m.kind] ?? '🧠'}</div>
      <div style="flex:1">
        <div class="memory-text">${m.text}</div>
        <div class="memory-meta">${m.kind} · ${m.source} · ${new Date(m.created).toLocaleDateString()}</div>
      </div>
      <button class="memory-del-btn" data-del-id="${m.id}" title="Forget this">🗑</button>
    </div>`).join('');

  return `
    <div class="chat-view">
      <div class="view-header">
        <div class="view-title">🧠 Memory (${state.memories.length})</div>
        <div style="display:flex;gap:0.5rem">
          <button class="icon-btn" id="btn-export-memory" title="Export all memories">⬇ Export</button>
          <button class="icon-btn" id="btn-refresh-memory" title="Refresh">↺</button>
        </div>
      </div>
      <div class="input-bar" style="border-top:none;border-bottom:1px solid var(--border)">
        <input id="memory-search" type="text" class="chat-input" style="max-height:none;height:36px"
          placeholder="Search memories…" value="" />
      </div>
      <div class="memory-grid">${cards || '<div style="color:var(--text-3);text-align:center;padding:2rem">No memories stored yet.</div>'}</div>
    </div>`;
}

// ── Skills view ──────────────────────────────────────────────────────────────
function buildSkillsView() {
  const tierBadge = { safe: 'badge-safe', ask: 'badge-warn', blocked: 'badge-danger' };
  const rows = state.skills.map(s => `
    <div class="audit-entry" style="grid-template-columns:1fr 60px 70px">
      <div>
        <div style="font-family:var(--mono);font-size:0.85rem;color:var(--cyan)">${s.name}</div>
        <div style="font-size:0.78rem;color:var(--text-3)">${s.description}</div>
      </div>
      <span class="badge ${tierBadge[s.tier] ?? 'badge-info'}">${s.tier}</span>
      <span style="font-size:0.75rem;color:var(--text-3)">${s.pack}</span>
    </div>`).join('');

  return `
    <div class="chat-view">
      <div class="view-header">
        <div class="view-title">🔧 Skills (${state.skills.length})</div>
        <div style="font-size:0.75rem;color:var(--text-3)">safe = auto · ask = approval · blocked = disabled</div>
      </div>
      <div style="flex:1;overflow-y:auto">
        <div class="audit-entry" style="grid-template-columns:1fr 60px 70px;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-3);padding:0.5rem 1.25rem">
          <div>Skill</div><div>Tier</div><div>Pack</div>
        </div>
        ${rows}
      </div>
    </div>`;
}

// ── Settings view ────────────────────────────────────────────────────────────
function buildSettingsView() {
  const cfg = state.config;
  return `
    <div class="chat-view">
      <div class="view-header">
        <div class="view-title">⚙️ Settings</div>
        <button class="icon-btn" id="btn-save-settings">💾 Save</button>
      </div>
      <div class="settings-body">
        <div class="setting-group">
          <div class="setting-group-title">Assistant</div>
          <div class="setting-row">
            <div><div class="setting-label">Name</div><div class="setting-desc">Your assistant's name</div></div>
            <input id="set-name" type="text" class="chat-input" style="width:160px;height:34px;padding:0 0.75rem"
              value="${cfg?.assistant?.name ?? ''}" maxlength="24" />
          </div>
          <div class="setting-row">
            <div><div class="setting-label">Tone</div><div class="setting-desc">Communication style</div></div>
            <select id="set-tone" class="chat-input" style="width:130px;height:34px;padding:0 0.5rem">
              ${['concise','friendly','formal'].map(t => `<option value="${t}" ${cfg?.assistant?.tone === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="setting-group">
          <div class="setting-group-title">Privacy</div>
          <div class="setting-row">
            <div><div class="setting-label">Mode</div><div class="setting-desc">offline = no network; hybrid = you can add cloud key</div></div>
            <select id="set-privacy" class="chat-input" style="width:130px;height:34px;padding:0 0.5rem">
              ${['offline','hybrid'].map(p => `<option value="${p}" ${cfg?.privacy?.mode === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="setting-group">
          <div class="setting-group-title">Hardware</div>
          <div class="setting-row">
            <div><div class="setting-label">Tier</div><div class="setting-desc">auto-detected from RAM/GPU; affects model choice</div></div>
            <span class="badge badge-info">${cfg?.hardware?.tier ?? 'auto'}</span>
          </div>
        </div>
        <div class="setting-group" style="border-color:rgba(239,68,68,0.2)">
          <div class="setting-group-title" style="color:var(--red)">Danger zone</div>
          <div class="setting-row">
            <div><div class="setting-label">Clear all memory</div><div class="setting-desc">Permanently delete all stored facts and notes</div></div>
            <button class="icon-btn" id="btn-clear-memory" style="color:var(--red)">🗑 Delete</button>
          </div>
          <div class="setting-row">
            <div><div class="setting-label">Reset audit log</div><div class="setting-desc">Delete the tamper-evident audit log file</div></div>
            <button class="icon-btn" id="btn-reset-audit" style="color:var(--red)">🗑 Delete</button>
          </div>
        </div>
      </div>
    </div>`;
}

// ── Approval overlay ─────────────────────────────────────────────────────────
function buildApprovalOverlay() {
  if (!state.pendingApproval) return '';
  const { skill, args, reason, tainted } = state.pendingApproval;
  const argsStr = JSON.stringify(args, null, 2);
  return `
    <div class="overlay" id="approval-overlay">
      <div class="approval-dialog slide-up">
        <div class="approval-icon">${tainted ? '⚠️' : '🔐'}</div>
        <div class="approval-title">Permission request</div>
        <div class="approval-reason">${reason}</div>
        ${tainted ? `<div class="taint-banner">⚠️ Untrusted content is in the session context. Be extra careful.</div>` : ''}
        <div class="approval-detail">
          <div class="approval-detail-row">
            <div class="approval-detail-key">Skill</div>
            <div class="approval-detail-val">${skill}</div>
          </div>
          <div class="approval-detail-row">
            <div class="approval-detail-key">Args</div>
            <div class="approval-detail-val"><pre style="margin:0;white-space:pre-wrap;font-size:0.78rem">${argsStr}</pre></div>
          </div>
        </div>
        <div class="approval-actions">
          <button class="btn-deny" id="btn-deny">✖ Deny</button>
          <button class="btn-approve" id="btn-approve">✔ Allow</button>
        </div>
      </div>
    </div>`;
}

// ── Event binding ────────────────────────────────────────────────────────────
function bindEvents() {
  // Sidebar navigation
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      if (state.view === 'audit') loadAudit();
      if (state.view === 'memory') loadMemory();
      if (state.view === 'skills') loadSkills();
      if (state.view === 'settings') loadConfig();
      render();
    });
  });

  // New chat
  document.getElementById('btn-new-chat')?.addEventListener('click', () => {
    state.messages = [];
    state.isThinking = false;
    render();
  });

  // Chat
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + 'px';
    });
  }

  document.getElementById('btn-send')?.addEventListener('click', sendMessage);
  document.getElementById('btn-cancel')?.addEventListener('click', cancelChat);
  document.getElementById('btn-clear-chat')?.addEventListener('click', () => { state.messages = []; render(); });
  document.getElementById('link-audit')?.addEventListener('click', e => { e.preventDefault(); state.view='audit'; loadAudit(); render(); });

  // Suggestion buttons
  document.querySelectorAll('.suggest-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('chat-input').value = btn.dataset.text;
      sendMessage();
    });
  });

  // Audit
  document.getElementById('btn-verify-audit')?.addEventListener('click', async () => {
    const r = await rpcSend('audit.verify', {});
    state.auditValid = r.valid;
    render();
  });
  document.getElementById('btn-refresh-audit')?.addEventListener('click', () => loadAudit().then(render));

  // Memory
  document.getElementById('btn-refresh-memory')?.addEventListener('click', () => loadMemory().then(render));
  document.getElementById('btn-export-memory')?.addEventListener('click', exportMemory);
  document.getElementById('memory-search')?.addEventListener('input', async e => {
    const q = e.target.value.trim();
    if (q.length >= 2) {
      state.memories = await rpcSend('memory.list', { query: q, limit: 20 });
    } else if (!q) {
      state.memories = await rpcSend('memory.list', { limit: 30 });
    }
    renderMemoryGrid();
  });
  document.querySelectorAll('[data-del-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Forget this memory permanently?')) return;
      await rpcSend('memory.delete', { id: Number(btn.dataset.delId) });
      await loadMemory();
      renderMemoryGrid();
    });
  });

  // Settings
  document.getElementById('btn-save-settings')?.addEventListener('click', saveSettings);

  // Approval
  document.getElementById('btn-approve')?.addEventListener('click', () => resolveApproval(true));
  document.getElementById('btn-deny')?.addEventListener('click', () => resolveApproval(false));

  // Mic
  document.getElementById('btn-mic')?.addEventListener('click', () => {
    state.recording = !state.recording;
    render(); // In real app, toggle WebRTC mic capture
  });
}

// ── Actions ──────────────────────────────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input?.value?.trim();
  if (!text || state.isThinking) return;
  input.value = '';
  input.style.height = 'auto';

  state.messages.push({ role: 'user', text, ts: Date.now() });
  state.isThinking = true;
  render();
  scrollToBottom();

  // Buffer streaming tokens
  let buffer = '';
  let assistantMsgIndex = null;

  rpcOnEvent((ev) => {
    if (ev.type === 'token') {
      buffer += ev.text;
      if (assistantMsgIndex === null) {
        assistantMsgIndex = state.messages.length;
        state.messages.push({ role: 'assistant', text: buffer, ts: Date.now() });
      } else {
        state.messages[assistantMsgIndex].text = buffer;
      }
      // Partial re-render of just the messages
      const el = document.getElementById('messages-list');
      if (el) {
        const lastMsg = el.querySelector('.message.assistant:last-of-type .message-bubble');
        if (lastMsg) lastMsg.innerHTML = buffer.replace(/\n/g, '<br>');
        else render();
      }
      scrollToBottom();
    } else if (ev.type === 'tool') {
      state.messages.push({ role: 'assistant', type: 'tool', name: ev.name, ok: ev.ok, ts: Date.now() });
      render();
      scrollToBottom();
    } else if (ev.type === 'final') {
      state.isThinking = false;
      if (assistantMsgIndex === null) {
        state.messages.push({ role: 'assistant', text: ev.text, ts: Date.now() });
      }
      render();
      scrollToBottom();
    }
  });

  try {
    await rpcSend('chat.send', { message: text });
  } catch (e) {
    state.isThinking = false;
    state.messages.push({ role: 'assistant', text: `Error: ${e.message}`, ts: Date.now() });
    render();
  }
}

async function cancelChat() {
  await rpcSend('chat.cancel', {});
  state.isThinking = false;
  render();
}

async function loadAudit() {
  state.auditEntries = await rpcSend('audit.list', { limit: 100 });
}
async function loadMemory() {
  state.memories = await rpcSend('memory.list', { limit: 50 });
}
async function loadSkills() {
  state.skills = await rpcSend('skills.list', {});
}
async function loadConfig() {
  state.config = await rpcSend('config.get', {});
}

function renderMemoryGrid() {
  const kindIcon = { fact: '💡', preference: '❤️', note: '📝' };
  const grid = document.querySelector('.memory-grid');
  if (grid) {
    grid.innerHTML = state.memories.map(m => `
      <div class="memory-card animate-in" data-id="${m.id}">
        <div class="memory-icon">${kindIcon[m.kind] ?? '🧠'}</div>
        <div style="flex:1">
          <div class="memory-text">${m.text}</div>
          <div class="memory-meta">${m.kind} · ${m.source} · ${new Date(m.created).toLocaleDateString()}</div>
        </div>
        <button class="memory-del-btn" data-del-id="${m.id}" title="Forget this">🗑</button>
      </div>`).join('') || '<div style="color:var(--text-3);text-align:center;padding:2rem">No results.</div>';
    document.querySelectorAll('[data-del-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Forget this memory permanently?')) return;
        await rpcSend('memory.delete', { id: Number(btn.dataset.delId) });
        await loadMemory();
        renderMemoryGrid();
      });
    });
  }
}

async function exportMemory() {
  const data = await rpcSend('memory.export', {});
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `kestrel-memory-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
}

async function saveSettings() {
  const patch = {
    assistant: { name: document.getElementById('set-name')?.value, tone: document.getElementById('set-tone')?.value },
    privacy: { mode: document.getElementById('set-privacy')?.value },
  };
  await rpcSend('config.update', { patch });
  await loadConfig();
  // Show saved toast
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;background:var(--green);color:#fff;padding:0.6rem 1.2rem;border-radius:8px;font-size:0.875rem;font-weight:600;z-index:999;animation:fadeIn 0.2s ease';
  toast.textContent = '✔ Settings saved';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function resolveApproval(approved) {
  state.pendingApproval?.resolve(approved);
  state.pendingApproval = null;
  render();
}

function scrollToBottom() {
  const el = document.getElementById('messages-list');
  if (el) el.scrollTop = el.scrollHeight;
}

// ── Boot ─────────────────────────────────────────────────────────────────────
async function boot() {
  await initRPC();

  // Set up the approval handler (core service sends approval.request events)
  rpcOnEvent((ev) => {
    if (ev.type === 'approval.request') {
      state.pendingApproval = {
        ...ev,
        resolve: (approved) => {
          // Send approval.respond back via RPC notify
          rpcSend('approval.respond', { approved });
        },
      };
      render();
    }
  });

  // Load initial data in parallel
  await Promise.all([loadConfig(), loadSkills()]);
  render();
}

boot();
