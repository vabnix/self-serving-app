import type { TerraformInputs } from "@/lib/requests";

type TriggerResult =
  | { status: "triggered" }
  | { status: "not_configured" }
  | { status: "error"; message: string };

// Starts the provisioning pipeline: a GitHub Actions workflow triggered
// through workflow_dispatch. Configured with environment variables; see
// .env.example.
export async function triggerPipeline(request: {
  id: string;
  templateId: string;
  inputs: TerraformInputs;
  callbackToken: string;
  // destroy removes what an earlier apply created for the same request.
  action?: "apply" | "destroy";
}): Promise<TriggerResult> {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  if (!token || !repository) return { status: "not_configured" };

  const workflow = process.env.GITHUB_WORKFLOW ?? "provision.yml";
  const ref = process.env.GITHUB_WORKFLOW_REF ?? "main";
  // Where the workflow reports the result. Without a public PORTAL_URL (for
  // example on localhost) the request stays "building".
  const portalUrl = process.env.PORTAL_URL?.replace(/\/+$/, "");

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          ref,
          inputs: {
            request_id: request.id,
            template: request.templateId,
            inputs: JSON.stringify(request.inputs),
            action: request.action ?? "apply",
            ...(portalUrl && {
              callback_url: `${portalUrl}/api/requests/${request.id}/status`,
              callback_token: request.callbackToken,
            }),
          },
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (response.ok) return { status: "triggered" };

    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    return {
      status: "error",
      message: `GitHub responded ${response.status}${body?.message ? `: ${body.message}` : ""}`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Request failed",
    };
  }
}
