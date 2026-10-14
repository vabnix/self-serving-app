import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { connection } from "next/server";
import { getStore, type Row } from "@/lib/store";

// submitted: saved, pipeline not started. building / deleting: a pipeline run
// is in progress. deleted: the resource is gone; the request is kept as a
// record.
export type RequestStatus =
  "submitted" | "building" | "deployed" | "failed" | "deleting" | "deleted";

export type TerraformInputs = Record<
  string,
  string | number | boolean | Record<string, string>
>;

export type NewRequest = {
  name: string;
  templateId: string;
  team: string;
  environment: string;
  // Absent for services that are not sized.
  size?: string;
  technicalContact: string;
  expiresOn?: string;
  inputs: TerraformInputs;
};

export type ResourceRequest = NewRequest & {
  id: string;
  status: RequestStatus;
  // Explains the status when the pipeline could not be started.
  pipelineNote?: string;
  // Reported by the pipeline when it finishes.
  outputs?: Record<string, unknown>;
  runUrl?: string;
  createdAt: string;
};

// What happened to a request, in order. Each entry is a row in the database.
export type RequestEventType =
  | "submitted"
  | "provisioning_started"
  | "deployed"
  | "provisioning_failed"
  | "deletion_requested"
  | "deleted"
  | "deletion_failed";

export type RequestEvent = {
  type: RequestEventType;
  detail?: string;
  at: string;
};

export async function recordEvent(
  id: string,
  type: RequestEventType,
  detail?: string,
) {
  const store = await getStore();
  await store.addEvent({
    request_id: id,
    type,
    detail: detail ?? null,
    created_at: new Date().toISOString(),
  });
}

export async function listEvents(id: string): Promise<RequestEvent[]> {
  await connection();
  const store = await getStore();
  return (await store.listEvents(id)).map((event) => ({
    type: event.type as RequestEventType,
    detail: event.detail ?? undefined,
    at: event.created_at,
  }));
}

function fromRow(row: Row): ResourceRequest {
  return {
    id: row.id,
    name: row.name,
    templateId: row.template_id,
    team: row.team,
    environment: row.environment,
    size: row.size ?? undefined,
    technicalContact: row.technical_contact,
    expiresOn: row.expires_on ?? undefined,
    status: row.status,
    pipelineNote: row.pipeline_note ?? undefined,
    inputs: JSON.parse(row.inputs),
    outputs: row.outputs ? JSON.parse(row.outputs) : undefined,
    runUrl: row.run_url ?? undefined,
    createdAt: row.created_at,
  };
}

export async function listRequests() {
  await connection();
  const store = await getStore();
  return (await store.list()).map(fromRow);
}

export async function getRequest(id: string) {
  await connection();
  const store = await getStore();
  const row = await store.get(id);
  return row && fromRow(row);
}

// Returns the new request's ID and the secret the pipeline must present when
// it reports the result.
export async function createRequest(request: NewRequest) {
  const id = `req-${randomUUID().slice(0, 8)}`;
  const callbackToken = randomBytes(32).toString("hex");
  const store = await getStore();
  await store.insert({
    id,
    name: request.name,
    template_id: request.templateId,
    team: request.team,
    environment: request.environment,
    size: request.size ?? null,
    technical_contact: request.technicalContact,
    expires_on: request.expiresOn ?? null,
    status: "submitted",
    pipeline_note: null,
    inputs: JSON.stringify(request.inputs),
    created_at: new Date().toISOString(),
    callback_token: callbackToken,
    outputs: null,
    run_url: null,
  });
  await recordEvent(id, "submitted");
  return { id, callbackToken };
}

export async function setRequestStatus(
  id: string,
  status: RequestStatus,
  pipelineNote?: string,
) {
  const store = await getStore();
  await store.update(id, { status, pipeline_note: pipelineNote ?? null });
}

// The request plus the secret the pipeline presents when it reports back,
// for starting another pipeline run on an existing request. Requests saved
// before tokens existed get one here.
export async function getPipelineContext(id: string) {
  const store = await getStore();
  const row = await store.get(id);
  if (!row) return undefined;

  let callbackToken = row.callback_token;
  if (!callbackToken) {
    callbackToken = randomBytes(32).toString("hex");
    await store.update(id, { callback_token: callbackToken });
  }
  return { request: fromRow(row), callbackToken };
}

// Records the result the pipeline reported. Returns false when the request
// does not exist or the token is not the one issued for it.
export async function recordPipelineResult(
  id: string,
  token: string,
  result: {
    status: "deployed" | "deleted" | "failed";
    outputs?: Record<string, unknown>;
    runUrl?: string;
  },
) {
  const store = await getStore();
  const row = await store.get(id);
  const expected = Buffer.from(row?.callback_token ?? "");
  const presented = Buffer.from(token);
  if (
    expected.length === 0 ||
    expected.length !== presented.length ||
    !timingSafeEqual(expected, presented)
  ) {
    return false;
  }

  if (result.status === "failed") {
    // Keep the outputs: after a failed deletion the resource still exists.
    const deleting = row?.status === "deleting";
    const action = deleting ? "Deletion" : "Provisioning";
    await recordEvent(id, deleting ? "deletion_failed" : "provisioning_failed");
    await store.update(id, {
      status: "failed",
      pipeline_note: `${action} failed. Contact the platform team and quote the request ID.`,
      run_url: result.runUrl ?? null,
    });
    return true;
  }

  await store.update(id, {
    status: result.status,
    pipeline_note: null,
    outputs:
      result.status === "deployed" && result.outputs
        ? JSON.stringify(result.outputs)
        : null,
    run_url: result.runUrl ?? null,
  });
  await recordEvent(id, result.status);
  return true;
}
