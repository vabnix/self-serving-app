import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Row, Store } from "@/lib/store";

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

  return {
    async list() {
      return db
        .prepare("SELECT * FROM requests ORDER BY created_at DESC")
        .all() as Row[];
    },
    async get(id) {
      return db.prepare("SELECT * FROM requests WHERE id = ?").get(id) as
        | Row
        | undefined;
    },
    async insert(row) {
      db.prepare(
        `INSERT INTO requests (id, name, template_id, team, environment, size,
           technical_contact, expires_on, status, pipeline_note, inputs,
           created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        row.id,
        row.name,
        row.template_id,
        row.team,
        row.environment,
        row.size,
        row.technical_contact,
        row.expires_on,
        row.status,
        row.pipeline_note,
        row.inputs,
        row.created_at,
      );
    },
    async setStatus(id, status, pipelineNote) {
      db.prepare(
        "UPDATE requests SET status = ?, pipeline_note = ? WHERE id = ?",
      ).run(status, pipelineNote, id);
    },
  };
}
