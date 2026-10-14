import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { addedColumns, type EventRow, type Row, type Store } from "@/lib/store";

export function createSqliteStore(): Store {
  const path = resolve(
    /*turbopackIgnore: true*/ process.env.DATABASE_PATH ?? "data/portal.db",
  );
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      template_id TEXT NOT NULL,
      team TEXT NOT NULL,
      environment TEXT NOT NULL,
      size TEXT,
      technical_contact TEXT NOT NULL,
      expires_on TEXT,
      status TEXT NOT NULL,
      pipeline_note TEXT,
      inputs TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS request_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT NOT NULL,
      type TEXT NOT NULL,
      detail TEXT,
      created_at TEXT NOT NULL
    )
  `);
  const existing = db.prepare("PRAGMA table_info(requests)").all();
  for (const [column, type] of addedColumns) {
    if (!existing.some((info) => info.name === column)) {
      db.exec(`ALTER TABLE requests ADD COLUMN ${column} ${type}`);
    }
  }

  return {
    async list() {
      return db
        .prepare("SELECT * FROM requests ORDER BY created_at DESC")
        .all() as Row[];
    },
    async get(id) {
      return db.prepare("SELECT * FROM requests WHERE id = ?").get(id) as
        Row | undefined;
    },
    async insert(row) {
      const columns = Object.keys(row);
      db.prepare(
        `INSERT INTO requests (${columns.join(", ")})
         VALUES (${columns.map(() => "?").join(", ")})`,
      ).run(...Object.values(row));
    },
    async update(id, changes) {
      const columns = Object.keys(changes);
      if (columns.length === 0) return;
      db.prepare(
        `UPDATE requests SET ${columns.map((column) => `${column} = ?`).join(", ")}
         WHERE id = ?`,
      ).run(...Object.values(changes), id);
    },
    async addEvent(event) {
      db.prepare(
        `INSERT INTO request_events (request_id, type, detail, created_at)
         VALUES (?, ?, ?, ?)`,
      ).run(event.request_id, event.type, event.detail, event.created_at);
    },
    async listEvents(requestId) {
      return db
        .prepare(
          `SELECT request_id, type, detail, created_at FROM request_events
           WHERE request_id = ? ORDER BY id`,
        )
        .all(requestId) as EventRow[];
    },
  };
}
