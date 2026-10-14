"use server";

import { redirect } from "next/navigation";
import { catalog } from "@/lib/catalog";
import { triggerPipeline } from "@/lib/pipeline";
import { parseRequest } from "@/lib/request-inputs";
import {
  createRequest,
  getPipelineContext,
  recordEvent,
  setRequestStatus,
} from "@/lib/requests";

// Saves a request, starts the provisioning pipeline, and sends the user to
// the request's page. Returns an error message when the form is invalid.
export async function submitRequest(templateId: string, data: FormData) {
  const item = catalog.find((item) => item.id === templateId);
  if (!item) return { error: "This service is no longer in the catalog." };

  const parsed = parseRequest(item, data);
  if (!parsed.ok) return { error: parsed.error };

  const { id, callbackToken } = await createRequest(parsed.request);

  if (!item.provisionable) {
    await setRequestStatus(
      id,
      "submitted",
      "Provisioning for this service is not available yet, so nothing has been provisioned.",
    );
    redirect(`/resources/${id}`);
  }

  const result = await triggerPipeline({
    id,
    templateId,
    inputs: parsed.request.inputs,
    callbackToken,
  });
  if (result.status === "triggered") {
    await setRequestStatus(id, "building");
    await recordEvent(id, "provisioning_started");
  } else if (result.status === "error") {
    await setRequestStatus(
      id,
      "failed",
      `The provisioning pipeline could not be started. ${result.message}`,
    );
    await recordEvent(id, "provisioning_failed", result.message);
  } else {
    await setRequestStatus(
      id,
      "submitted",
      "The provisioning pipeline is not configured, so nothing has been provisioned.",
    );
  }

  redirect(`/resources/${id}`);
}

// Removes a request's resource by running the pipeline's destroy, or just
// marks the request deleted when nothing was ever provisioned for it.
// Returns an error message when deletion could not be started.
export async function deleteResource(id: string) {
  const context = await getPipelineContext(id);
  if (!context) return { error: "This request no longer exists." };

  const { request, callbackToken } = context;
  if (request.status === "deleting" || request.status === "deleted") {
    return { error: "This resource is already being deleted." };
  }

  const item = catalog.find((item) => item.id === request.templateId);
  if (!item?.provisionable || request.status === "submitted") {
    await recordEvent(id, "deletion_requested");
    await setRequestStatus(id, "deleted");
    await recordEvent(id, "deleted", "Nothing had been provisioned.");
    return;
  }

  const result = await triggerPipeline({
    id,
    templateId: request.templateId,
    inputs: request.inputs,
    callbackToken,
    action: "destroy",
  });
  if (result.status === "not_configured") {
    return { error: "The provisioning pipeline is not configured." };
  }
  if (result.status === "error") {
    return { error: `Deletion could not be started. ${result.message}` };
  }
  await recordEvent(id, "deletion_requested");
  await setRequestStatus(id, "deleting");
}
