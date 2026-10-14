import { recordPipelineResult } from "@/lib/requests";

const MAX_BODY_BYTES = 100_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Called by the provisioning workflow when it finishes, with the per-request
// token the portal passed to it as a bearer token.
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/requests/[id]/status">,
) {
  const { id } = await params;
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return Response.json({ error: "Body too large" }, { status: 413 });
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !isRecord(body) ||
    (body.status !== "deployed" && body.status !== "failed") ||
    (body.outputs !== undefined && !isRecord(body.outputs)) ||
    (body.run_url !== undefined &&
      (typeof body.run_url !== "string" ||
        !body.run_url.startsWith("https://github.com/")))
  ) {
    return Response.json({ error: "Invalid result" }, { status: 400 });
  }

  const recorded = await recordPipelineResult(id, token, {
    status: body.status,
    outputs: body.outputs,
    runUrl: body.run_url,
  });
  if (!recorded) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({ ok: true });
}
