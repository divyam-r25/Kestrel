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
