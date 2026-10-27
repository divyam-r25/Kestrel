import { DatabaseSync } from 'node:sqlite';

// Local memory: one SQLite file the user can copy, back up, or delete. FTS5 gives ranked keyword
// recall with zero dependencies. A vector index (sqlite-vec) can be layered on later behind the same API.
export class MemoryStore {
  constructor(path = ':memory:', { clock = () => Date.now() } = {}) {
    this.db = new DatabaseSync(path);
    this.clock = clock;
    this.db.exec(`
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS memories(id INTEGER PRIMARY KEY, kind TEXT NOT NULL, text TEXT NOT NULL, source TEXT, created INTEGER NOT NULL);
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(text, content='memories', content_rowid='id');
      CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN INSERT INTO memories_fts(rowid,text) VALUES (new.id,new.text); END;
      CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN INSERT INTO memories_fts(memories_fts,rowid,text) VALUES('delete',old.id,old.text); END;
      CREATE TABLE IF NOT EXISTS reminders(id INTEGER PRIMARY KEY, text TEXT NOT NULL, due INTEGER NOT NULL, done INTEGER NOT NULL DEFAULT 0);
    `);
  }

  remember({ text, kind = 'fact', source = 'user' }) {
    const r = this.db.prepare('INSERT INTO memories(kind,text,source,created) VALUES (?,?,?,?)').run(kind, text, source, this.clock());
    return Number(r.lastInsertRowid);
  }

  // Query terms are quoted individually so user text can never inject FTS syntax.
  recall(query, { limit = 5, kind = null } = {}) {
    const terms = String(query).toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    if (!terms.length) return [];
    const match = terms.map((t) => `"${t}"`).join(' OR ');
    const sql = `SELECT m.id,m.kind,m.text,m.source,m.created,bm25(memories_fts) AS score
                 FROM memories_fts JOIN memories m ON m.id=memories_fts.rowid
                 WHERE memories_fts MATCH ? ${kind ? 'AND m.kind = ?' : ''} ORDER BY score LIMIT ?`;
    const params = kind ? [match, kind, limit] : [match, limit];
    return this.db.prepare(sql).all(...params).map((r) => ({ ...r }));
  }

  forget(id) { return Number(this.db.prepare('DELETE FROM memories WHERE id=?').run(id).changes) > 0; }
  count() { return this.db.prepare('SELECT COUNT(*) c FROM memories').get().c; }

  addReminder(text, due) {
    return Number(this.db.prepare('INSERT INTO reminders(text,due) VALUES (?,?)').run(text, due).lastInsertRowid);
  }
  dueReminders(now = this.clock()) {
    return this.db.prepare('SELECT id,text,due FROM reminders WHERE done=0 AND due<=? ORDER BY due').all(now).map((r) => ({ ...r }));
  }
  upcomingReminders(limit = 10) {
    return this.db.prepare('SELECT id,text,due FROM reminders WHERE done=0 ORDER BY due LIMIT ?').all(limit).map((r) => ({ ...r }));
  }
  completeReminder(id) { return Number(this.db.prepare('UPDATE reminders SET done=1 WHERE id=?').run(id).changes) > 0; }
  close() { this.db.close(); }
}
