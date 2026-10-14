import { randomUUID } from "node:crypto";
import { connection } from "next/server";
import { getStore, type Row } from "@/lib/store";

// submitted: saved, pipeline not started. building: pipeline triggered.
export type RequestStatus = "submitted" | "building" | "deployed" | "failed";

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
  createdAt: string;
};

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

export async function createRequest(request: NewRequest) {
  const id = `req-${randomUUID().slice(0, 8)}`;
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
  });
  return id;
}

export async function setRequestStatus(
  id: string,
  status: RequestStatus,
  pipelineNote?: string,
) {
  const store = await getStore();
  await store.setStatus(id, status, pipelineNote ?? null);
}
