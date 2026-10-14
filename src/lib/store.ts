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
  // Secret the pipeline presents when it reports the result of this request.
  callback_token: string | null;
  // Terraform outputs as JSON, and the pipeline run that produced them.
  outputs: string | null;
  run_url: string | null;
  // Name of the signed-in user who submitted the request. Null for requests
  // made before sign-in was added.
  requester: string | null;
};

// Columns added after the first release, as [name, SQLite type, SQL Server type].
export const addedColumns = [
  ["callback_token", "TEXT", "NVARCHAR(100)"],
  ["outputs", "TEXT", "NVARCHAR(MAX)"],
  ["run_url", "TEXT", "NVARCHAR(400)"],
  ["requester", "TEXT", "NVARCHAR(200)"],
] as const;

export type RowUpdate = Partial<
  Pick<
    Row,
    "status" | "pipeline_note" | "outputs" | "run_url" | "callback_token"
  >
>;

// One row per thing that happened to a request: submitted, deployed, deletion
// requested, deleted, and so on.
export type EventRow = {
  request_id: string;
  type: string;
  detail: string | null;
  created_at: string;
};

export type Store = {
  list(): Promise<Row[]>;
  get(id: string): Promise<Row | undefined>;
  insert(row: Row): Promise<void>;
  update(id: string, changes: RowUpdate): Promise<void>;
  addEvent(event: EventRow): Promise<void>;
  listEvents(requestId: string): Promise<EventRow[]>;
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
