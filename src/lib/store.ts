import type { RequestStatus } from "@/lib/requests";

export type Row = {
  id: string;
  name: string;
  template_id: string;
  team: string;
  environment: string;
  size: string | null;
  technical_contact: string;
  expires_on: string | null;
  status: RequestStatus;
  pipeline_note: string | null;
  inputs: string;
  created_at: string;
};

export type Store = {
  list(): Promise<Row[]>;
  get(id: string): Promise<Row | undefined>;
  insert(row: Row): Promise<void>;
  setStatus(
    id: string,
    status: RequestStatus,
    pipelineNote: string | null,
  ): Promise<void>;
};

const globalForStore = globalThis as { portalStore?: Promise<Store> };

// Azure SQL when AZURE_SQL_CONNECTION_STRING is set, otherwise a local SQLite
// file. One store per server process, reused across dev hot reloads.
export function getStore() {
  globalForStore.portalStore ??= process.env.AZURE_SQL_CONNECTION_STRING
    ? import("@/lib/store-azure-sql").then((module) =>
        module.createAzureSqlStore(process.env.AZURE_SQL_CONNECTION_STRING!),
      )
    : import("@/lib/store-sqlite").then((module) => module.createSqliteStore());
  // Do not cache a failed connection; the next request tries again.
  globalForStore.portalStore.catch(() => {
    globalForStore.portalStore = undefined;
  });
  return globalForStore.portalStore;
}
