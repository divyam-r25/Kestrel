import { defineSkill } from '../core/skill.js';

export const notesAdd = defineSkill({
  name: 'study.notes_add', pack: 'student', tier: 'safe', sideEffects: 'memory',
  description: 'Save a study note with an optional subject tag.',
  inputSchema: { type: 'object', required: ['text'], properties: {
    text: { type: 'string', minLength: 3, maxLength: 4000 }, subject: { type: 'string', maxLength: 60 } } },
  async run({ text, subject }, ctx) {
    const source = ctx.session?.tainted ? `session-tainted:${ctx.session.sources.join('+')}` : 'user';
    const id = ctx.memory.remember({ text: subject ? `[${subject}] ${text}` : text, kind: 'note', source });
    return { result: { id }, evidence: [{ type: 'note', ref: String(id) }], limits: [] };
  },
});

export const notesSearch = defineSkill({
  name: 'study.notes_search', pack: 'student', tier: 'safe',
  description: 'Search the user\'s saved study notes by keywords, ranked by relevance.',
  inputSchema: { type: 'object', required: ['query'], properties: {
    query: { type: 'string', minLength: 1, maxLength: 200 }, limit: { type: 'integer', minimum: 1, maximum: 20, default: 5 } } },
  async run({ query, limit }, ctx) {
    const rows = ctx.memory.recall(query, { limit, kind: 'note' });
    const untrusted = rows.some((r) => r.source !== 'user');
    return { result: { notes: rows.map(({ id, text, source }) => ({ id, text, source })) }, untrusted,
      evidence: rows.map((r) => ({ type: 'note', ref: String(r.id) })), limits: ['keyword search (BM25); semantic search not enabled yet'] };
  },
});

// ── study.deadlines ──────────────────────────────────────────────────────────
export const studyDeadlines = defineSkill({
  name: 'study.deadlines', pack: 'student', tier: 'safe', sideEffects: 'memory',
  description: 'Add a study deadline (exam, assignment, project) or list upcoming deadlines.',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['add', 'list'], default: 'list' },
      subject: { type: 'string', maxLength: 60, description: 'Course or subject name' },
      task: { type: 'string', maxLength: 300, description: 'What is due (e.g. "Unit 3 exam")' },
      dueDate: { type: 'string', maxLength: 30, description: 'ISO date string or natural language like "2026-12-15"' },
      limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 },
    },
  },
  async run({ action, subject, task, dueDate, limit }, ctx) {
    if ((action ?? 'list') === 'add') {
      if (!task) throw new Error('task is required when adding a deadline');
      const text = subject ? `[deadline][${subject}] ${task} — due ${dueDate ?? 'TBD'}` : `[deadline] ${task} — due ${dueDate ?? 'TBD'}`;
      const source = ctx.session?.tainted ? `session-tainted:${ctx.session.sources.join('+')}` : 'user';
      const id = ctx.memory.remember({ text, kind: 'note', source });
      return {
        result: { id, recorded: text },
        evidence: [{ type: 'note', ref: String(id) }],
        limits: ['stored as a tagged note; use study.notes_search with "deadline" to retrieve'],
      };
    }
    // list upcoming deadlines
    const rows = ctx.memory.recall('deadline', { limit, kind: 'note' });
    return {
      result: { deadlines: rows.map(({ id, text, source }) => ({ id, text, source })) },
      evidence: rows.map((r) => ({ type: 'note', ref: String(r.id) })),
      limits: ['keyword search — deadlines without the word "deadline" in text may not appear'],
    };
  },
});
