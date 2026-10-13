import { ArrowLeft, Box } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteResourceButton from "@/components/DeleteResourceButton";
import IconTile from "@/components/IconTile";
import StatusBadge from "@/components/StatusBadge";
import { catalog } from "@/lib/catalog";
import { getRequest, requests } from "@/lib/requests";

export function generateStaticParams() {
  return requests.map((request) => ({ id: request.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/resources/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: getRequest(id)?.name };
}

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
      <dd className="mt-1 font-semibold">{children}</dd>
    </div>
  );
}

export default async function ResourcePage({
  params,
}: PageProps<"/resources/[id]">) {
  const { id } = await params;
  const request = getRequest(id);
  if (!request) notFound();

  const template = catalog.find((item) => item.id === request.templateId);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/submissions"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-blue-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to My Requests
      </Link>

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
          <DeleteResourceButton name={request.name} />
        </div>
      </div>

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">
            Deployed Infrastructure Components
          </h2>
          {request.components.length === 0 && (
            <p className="mt-4 text-zinc-600">
              No components yet. Provisioning is still in progress.
            </p>
          )}
          <div className="mt-4 flex flex-col gap-4">
            {request.components.map((component) => (
              <div
                key={component.resourceId}
                className="rounded-xl p-5 ring-1 ring-zinc-950/10"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{component.name}</h3>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                    {component.type}
                  </span>
                </div>
                <dl className="mt-4">
                  <dt className="eyebrow">Resource ID</dt>
                  <dd className="mt-2 rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-5 break-all text-zinc-200">
                    {component.resourceId}
                  </dd>
                </dl>
                <h4 className="eyebrow mt-5">Configuration Details</h4>
                <dl className="mt-2 grid gap-x-8 sm:grid-cols-2">
                  {component.config.map((field) => (
                    <div
                      key={field.label}
                      className="border-b border-zinc-950/5 py-2.5"
                    >
                      <dt className="text-xs text-zinc-500">{field.label}</dt>
                      <dd className="mt-0.5 font-mono text-sm break-all">
                        {field.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="card p-6">
            <h2 className="text-lg font-semibold">Request Details</h2>
            <dl className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-3">
              <Tile label="Team">{request.team}</Tile>
              <Tile label="Environment">{request.environment}</Tile>
              {request.size && <Tile label="Size">{request.size}</Tile>}
            </dl>
          </section>

          {request.metadata && (
            <section className="card p-6">
              <h2 className="text-lg font-semibold">Infrastructure Metadata</h2>
              <dl className="mt-4 grid gap-3">
                <Tile label="Subscription ID">
                  <span className="font-mono text-xs font-normal break-all">
                    {request.metadata.subscriptionId}
                  </span>
                </Tile>
                <Tile label="Resource Group">
                  {request.metadata.resourceGroup}
                </Tile>
                <Tile label="Location">{request.metadata.location}</Tile>
                <Tile label="Created At">{request.metadata.createdAt}</Tile>
              </dl>
            </section>
          )}

          {Object.keys(request.tags).length > 0 && (
            <section className="card p-6">
              <h2 className="text-lg font-semibold">Tags</h2>
              <dl className="mt-4 flex flex-wrap gap-2">
                {Object.entries(request.tags).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex overflow-hidden rounded-lg text-sm ring-1 ring-zinc-950/10"
                  >
                    <dt className="bg-zinc-100 px-2.5 py-1.5 font-mono text-xs leading-5 text-zinc-600">
                      {key}
                    </dt>
                    <dd className="px-2.5 py-1.5 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
