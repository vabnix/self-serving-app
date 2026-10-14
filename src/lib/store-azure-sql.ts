import sql from "mssql";
import { addedColumns, type EventRow, type Row, type Store } from "@/lib/store";

// A serverless database pauses when idle and takes up to a minute to resume;
// until then it refuses connections. Retry instead of failing the request.
async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const { code, number } = error as { code?: string; number?: number };
      const resuming =
        number === 40613 || code === "ETIMEOUT" || code === "ESOCKET";
      if (!resuming || attempt === 6) throw error;
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }
}

export async function createAzureSqlStore(
  connectionString: string,
): Promise<Store> {
  const pool = await withRetry(() =>
    new sql.ConnectionPool(connectionString).connect(),
  );
  await pool.request().query(`
    IF OBJECT_ID('requests', 'U') IS NULL
    CREATE TABLE requests (
      id NVARCHAR(40) PRIMARY KEY,
      name NVARCHAR(100) NOT NULL,
      template_id NVARCHAR(100) NOT NULL,
      team NVARCHAR(100) NOT NULL,
      environment NVARCHAR(40) NOT NULL,
      size NVARCHAR(40),
      technical_contact NVARCHAR(320) NOT NULL,
      expires_on NVARCHAR(10),
      status NVARCHAR(20) NOT NULL,
      pipeline_note NVARCHAR(MAX),
      inputs NVARCHAR(MAX) NOT NULL,
      created_at NVARCHAR(30) NOT NULL
    )
  `);
  await pool.request().query(`
    IF OBJECT_ID('request_events', 'U') IS NULL
    CREATE TABLE request_events (
      id INT IDENTITY PRIMARY KEY,
      request_id NVARCHAR(40) NOT NULL,
      type NVARCHAR(40) NOT NULL,
      detail NVARCHAR(MAX),
      created_at NVARCHAR(30) NOT NULL
    )
  `);
  for (const [column, , type] of addedColumns) {
    await pool.request().query(`
      IF COL_LENGTH('requests', '${column}') IS NULL
      ALTER TABLE requests ADD ${column} ${type}
    `);
  }

  return {
    async list() {
      const result = await withRetry(() =>
        pool
          .request()
          .query<Row>("SELECT * FROM requests ORDER BY created_at DESC"),
      );
      return result.recordset;
    },
    async get(id) {
      const result = await withRetry(() =>
        pool
          .request()
          .input("id", sql.NVarChar, id)
          .query<Row>("SELECT * FROM requests WHERE id = @id"),
      );
      return result.recordset[0];
    },
    async insert(row) {
      const columns = Object.keys(row);
      const request = pool.request();
      for (const [column, value] of Object.entries(row)) {
        request.input(column, sql.NVarChar, value);
      }
      await request.query(
        `INSERT INTO requests (${columns.join(", ")})
         VALUES (${columns.map((column) => `@${column}`).join(", ")})`,
      );
    },
    async update(id, changes) {
      const columns = Object.keys(changes);
      if (columns.length === 0) return;
      const request = pool.request().input("id", sql.NVarChar, id);
      for (const [column, value] of Object.entries(changes)) {
        request.input(column, sql.NVarChar, value);
      }
      await request.query(
        `UPDATE requests SET ${columns.map((column) => `${column} = @${column}`).join(", ")}
         WHERE id = @id`,
      );
    },
    async addEvent(event) {
      const request = pool.request();
      for (const [column, value] of Object.entries(event)) {
        request.input(column, sql.NVarChar, value);
      }
      await withRetry(() =>
        request.query(
          `INSERT INTO request_events (request_id, type, detail, created_at)
           VALUES (@request_id, @type, @detail, @created_at)`,
        ),
      );
    },
    async listEvents(requestId) {
      const result = await withRetry(() =>
        pool
          .request()
          .input("request_id", sql.NVarChar, requestId)
          .query<EventRow>(
            `SELECT request_id, type, detail, created_at FROM request_events
             WHERE request_id = @request_id ORDER BY id`,
          ),
      );
      return result.recordset;
    },
  };
}
