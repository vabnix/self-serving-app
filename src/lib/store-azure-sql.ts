import sql from "mssql";
import type { Row, Store } from "@/lib/store";

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
      const request = pool.request();
      for (const [column, value] of Object.entries(row)) {
        request.input(column, sql.NVarChar, value);
      }
      await request.query(
        `INSERT INTO requests (id, name, template_id, team, environment, size,
           technical_contact, expires_on, status, pipeline_note, inputs,
           created_at)
         VALUES (@id, @name, @template_id, @team, @environment, @size,
           @technical_contact, @expires_on, @status, @pipeline_note, @inputs,
           @created_at)`,
      );
    },
    async setStatus(id, status, pipelineNote) {
      await pool
        .request()
        .input("id", sql.NVarChar, id)
        .input("status", sql.NVarChar, status)
        .input("pipeline_note", sql.NVarChar, pipelineNote)
        .query(
          "UPDATE requests SET status = @status, pipeline_note = @pipeline_note WHERE id = @id",
        );
    },
  };
}
