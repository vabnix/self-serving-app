import { ArrowLeft, Box, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import DeleteResourceButton from "@/components/DeleteResourceButton";
import IconTile from "@/components/IconTile";
import StatusBadge from "@/components/StatusBadge";
import { catalog } from "@/lib/catalog";
import { capitalize, environmentLabel, formatDateTime } from "@/lib/format";
import { generateNames } from "@/lib/naming";
import { getRequest } from "@/lib/requests";

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

async function RequestDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await getRequest(id);
  if (!request) notFound();

  const template = catalog.find((item) => item.id === request.templateId);
  const names = generateNames(request.templateId, request);

  return (
    <>
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
          {request.runUrl && (
            <a
              href={request.runUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
            >
              Pipeline run
              <ExternalLink className="size-4" aria-hidden />
            </a>
          )}
          <DeleteResourceButton name={request.name} />
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

          <section className="card p-6 sm:p-8">
            <h2 className="text-lg font-semibold">Terraform inputs</h2>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-5 text-zinc-200">
              {JSON.stringify(request.inputs, null, 2)}
            </pre>
          </section>
        </div>

        <section className="card p-6">
          <h2 className="text-lg font-semibold">Request Details</h2>
          <dl className="mt-4 grid gap-3">
            <Tile label="Request ID">
              <span className="font-mono text-sm font-normal">
                {request.id}
              </span>
            </Tile>
            <Tile label="Team">{request.team}</Tile>
            <Tile label="Environment">
              {environmentLabel(request.environment)}
            </Tile>
            {request.size && (
              <Tile label="Size">{capitalize(request.size)}</Tile>
            )}
            <Tile label="Technical point of contact">
              {request.technicalContact}
            </Tile>
            <Tile label="Expires on">{request.expiresOn ?? "No expiry"}</Tile>
            <Tile label="Submitted">{formatDateTime(request.createdAt)}</Tile>
          </dl>
        </section>
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
