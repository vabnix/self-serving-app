"use server";

import { redirect } from "next/navigation";
import { catalog } from "@/lib/catalog";
import { triggerPipeline } from "@/lib/pipeline";
import { parseRequest } from "@/lib/request-inputs";
import { createRequest, setRequestStatus } from "@/lib/requests";

// Saves a request, starts the provisioning pipeline, and sends the user to
// the request's page. Returns an error message when the form is invalid.
export async function submitRequest(templateId: string, data: FormData) {
  const item = catalog.find((item) => item.id === templateId);
  if (!item) return { error: "This service is no longer in the catalog." };

  const parsed = parseRequest(item, data);
  if (!parsed.ok) return { error: parsed.error };

  const id = await createRequest(parsed.request);

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
  });
  if (result.status === "triggered") {
    await setRequestStatus(id, "building");
  } else if (result.status === "error") {
    await setRequestStatus(
      id,
      "failed",
      `The provisioning pipeline could not be started. ${result.message}`,
    );
  } else {
    await setRequestStatus(
      id,
      "submitted",
      "The provisioning pipeline is not configured, so nothing has been provisioned.",
    );
  }

  redirect(`/resources/${id}`);
}
