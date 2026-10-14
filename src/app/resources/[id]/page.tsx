import { ArrowLeft, Box, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AutoRefresh from "@/components/AutoRefresh";
import DeleteResourceButton from "@/components/DeleteResourceButton";
import IconTile from "@/components/IconTile";
import StatusBadge from "@/components/StatusBadge";
import { catalog } from "@/lib/catalog";
import { capitalize, environmentLabel, formatDateTime } from "@/lib/format";
import { generateNames } from "@/lib/naming";
import { getRequest, listEvents, type RequestEventType } from "@/lib/requests";

export const metadata: Metadata = {
  title: "Request details",
};

function Tile({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-950/5 ring-inset">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-1 font-semibold break-words">{children}</dd>
    </div>
  );
}

const eventLabels: Record<RequestEventType, string> = {
  submitted: "Request submitted",
  provisioning_started: "Provisioning started",
  deployed: "Deployed",
  provisioning_failed: "Provisioning failed",
  deletion_requested: "Deletion requested",
  deleted: "Deleted",
  deletion_failed: "Deletion failed",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isResourceId = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("/subscriptions/");

// "primary_blob_endpoint" -> "Primary blob endpoint"
const outputLabel = (key: string) =>
  key.charAt(0).toUpperCase() + key.slice(1).replaceAll("_", " ");

const outputValue = (value: unknown) =>
  Array.isArray(value)
    ? value.join(", ") || "None"
    : typeof value === "string"
      ? value
      : JSON.stringify(value);

// Splits the Terraform outputs the pipeline reported into the parts the page
// shows separately. Works for any template that follows the same conventions:
// resource IDs, plus optional `resource_group`, `location` and `tags`.
function describeOutputs(outputs: Record<string, unknown>) {
  const entries = Object.entries(outputs);
  const resourceIds = entries.filter((entry): entry is [string, string] =>
    isResourceId(entry[1]),
  );
  return {
    resourceIds,
    subscriptionId: resourceIds[0]?.[1].split("/")[2],
    resourceGroup: outputs.resource_group,
    location: outputs.location,
    tags: isRecord(outputs.tags) ? Object.entries(outputs.tags) : [],
    details: entries.filter(
      ([key, value]) =>
        !isResourceId(value) &&
        !["resource_group", "location", "tags"].includes(key),
    ),
  };
}

async function RequestDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await getRequest(id);
  if (!request) notFound();

  const template = catalog.find((item) => item.id === request.templateId);
  const names = generateNames(request.templateId, request);
  const deployed = request.outputs && describeOutputs(request.outputs);
  // Requests saved before activity was recorded still show when they began.
  const recorded = await listEvents(id);
  const events = recorded.some((event) => event.type === "submitted")
    ? recorded
    : [{ type: "submitted" as const, at: request.createdAt }, ...recorded];

  return (
    <>
      {(request.status === "building" || request.status === "deleting") && (
        <AutoRefresh />
      )}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <IconTile icon={template?.icon ?? Box} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title">{request.name}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="mt-1 text-lg text-zinc-600">{template?.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/submissions" className="btn btn-secondary">
            Back to Requests
          </Link>
          {request.status !== "deleted" && (
            <DeleteResourceButton
              id={request.id}
              name={request.name}
              deleting={request.status === "deleting"}
            />
          )}
        </div>
      </div>

      {request.pipelineNote && (
        <p
          className={`mt-8 rounded-xl p-4 text-sm font-medium ring-1 ring-inset ${
            request.status === "failed"
              ? "bg-red-50 text-red-800 ring-red-600/20"
              : "bg-amber-50 text-amber-900 ring-amber-600/20"
          }`}
        >
          {request.pipelineNote}
        </p>
      )}

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex flex-col gap-6">
          {deployed && (
            <section className="card p-6 sm:p-8">
              <h2 className="text-lg font-semibold">Deployed Infrastructure</h2>
              {deployed.resourceIds.map(([key, resourceId]) => (
                <div key={key} className="mt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="eyebrow">{outputLabel(key)}</h3>
                    <a
                      href={`https://portal.azure.com/#resource${resourceId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
                    >
                      Open in Azure portal
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  </div>
                  <p className="mt-2 rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-5 break-all text-zinc-200">
                    {resourceId}
                  </p>
                </div>
              ))}
              {deployed.details.length > 0 && (
                <>
                  <h3 className="eyebrow mt-6">Configuration Details</h3>
                  <dl className="mt-2 grid gap-x-8 sm:grid-cols-2">
                    {deployed.details.map(([key, value]) => (
                      <div
                        key={key}
                        className="border-b border-zinc-950/5 py-2.5"
                      >
                        <dt className="text-xs text-zinc-500">
                          {outputLabel(key)}
                        </dt>
                        <dd className="mt-0.5 font-mono text-sm break-all">
                          {outputValue(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
            </section>
          )}

          {!deployed && request.status !== "deleted" && (
            <section className="card p-6 sm:p-8">
              <h2 className="text-lg font-semibold">Azure resource names</h2>
              <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
                {names.map((generated) => (
                  <div
                    key={generated.key}
                    className="border-b border-zinc-950/5 py-2.5"
                  >
                    <dt className="text-xs text-zinc-500">{generated.label}</dt>
                    <dd className="mt-0.5 font-mono text-sm break-all">
                      {generated.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {deployed && (
            <section className="card p-6 sm:p-8">
              <h2 className="text-lg font-semibold">Infrastructure Metadata</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                {deployed.subscriptionId && (
                  <Tile label="Subscription ID">
                    <span className="font-mono text-xs font-normal break-all">
                      {deployed.subscriptionId}
                    </span>
                  </Tile>
                )}
                {typeof deployed.resourceGroup === "string" && (
                  <Tile label="Resource Group">{deployed.resourceGroup}</Tile>
                )}
                {typeof deployed.location === "string" && (
                  <Tile label="Region">{deployed.location}</Tile>
                )}
              </dl>
            </section>
          )}

          {deployed && deployed.tags.length > 0 && (
            <section className="card p-6 sm:p-8">
              <h2 className="text-lg font-semibold">Tags</h2>
              <dl className="mt-4 flex flex-wrap gap-2">
                {deployed.tags.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex overflow-hidden rounded-lg text-sm ring-1 ring-zinc-950/10"
                  >
                    <dt className="bg-zinc-100 px-2.5 py-1.5 font-mono text-xs leading-5 text-zinc-600">
                      {key}
                    </dt>
                    <dd className="px-2.5 py-1.5 font-medium break-all">
                      {outputValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className="card p-6 sm:p-8">
            <h2 className="text-lg font-semibold">Activity</h2>
            <ol className="mt-4 flex flex-col gap-4 border-l border-zinc-950/10 pl-5">
              {events.map((event, index) => (
                <li key={index} className="relative">
                  <span className="absolute top-1.5 -left-[1.5625rem] size-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                  <p className="text-sm font-semibold">
                    {eventLabels[event.type] ?? event.type}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatDateTime(event.at)}
                  </p>
                  {event.detail && (
                    <p className="mt-1 text-xs text-zinc-600">{event.detail}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="card p-6">
            <h2 className="text-lg font-semibold">Request Details</h2>
            <dl className="mt-4 grid gap-3">
              <Tile label="Request ID">
                <span className="font-mono text-sm font-normal">
                  {request.id}
                </span>
              </Tile>
              <Tile label="Team">{request.team}</Tile>
              {typeof request.inputs.resource_group === "string" && (
                <Tile label="Resource group">
                  {request.inputs.resource_group}
                </Tile>
              )}
              <Tile label="Environment">
                {environmentLabel(request.environment)}
              </Tile>
              {request.size && (
                <Tile label="Size">{capitalize(request.size)}</Tile>
              )}
              {request.requester && (
                <Tile label="Requested by">{request.requester}</Tile>
              )}
              <Tile label="Technical point of contact">
                {request.technicalContact}
              </Tile>
              <Tile label="Expires on">{request.expiresOn ?? "No expiry"}</Tile>
              <Tile label="Submitted">{formatDateTime(request.createdAt)}</Tile>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}

export default function ResourcePage({ params }: PageProps<"/resources/[id]">) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/submissions"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-blue-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to My Requests
      </Link>
      <Suspense
        fallback={<p className="mt-6 text-zinc-600">Loading request…</p>}
      >
        <RequestDetails params={params} />
      </Suspense>
    </main>
  );
}
