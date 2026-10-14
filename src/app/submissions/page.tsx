import { ArrowRight, Box } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AutoRefresh from "@/components/AutoRefresh";
import IconTile from "@/components/IconTile";
import StatusBadge from "@/components/StatusBadge";
import { catalog } from "@/lib/catalog";
import { capitalize, environmentLabel, formatDateTime } from "@/lib/format";
import { listRequests } from "@/lib/requests";

export const metadata: Metadata = {
  title: "My Requests",
};

async function RequestList() {
  const requests = await listRequests();

  if (requests.length === 0) {
    return (
      <div className="card flex flex-col items-start gap-4 p-8">
        <p className="text-zinc-600">
          No requests yet. Pick a service from the catalog to create one.
        </p>
        <Link href="/catalog" className="btn btn-primary">
          Browse Catalog
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const inProgress = requests.some(
    (request) => request.status === "building" || request.status === "deleting",
  );

  return (
    <ul className="flex flex-col gap-4">
      {inProgress && <AutoRefresh />}
      {requests.map((request) => {
        const template = catalog.find((item) => item.id === request.templateId);
        const fields = [
          { label: "Team", value: request.team },
          {
            label: "Environment",
            value: environmentLabel(request.environment),
          },
          { label: "Size", value: request.size && capitalize(request.size) },
          { label: "Created", value: formatDateTime(request.createdAt) },
        ].filter((field) => field.value);
        return (
          <li
            key={request.id}
            className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center"
          >
            <IconTile icon={template?.icon ?? Box} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold tracking-tight">
                  {request.name}
                </h2>
                <StatusBadge status={request.status} />
              </div>
              <p className="mt-0.5 text-sm text-zinc-600">{template?.name}</p>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                {fields.map((field) => (
                  <div key={field.label}>
                    <dt className="text-xs text-zinc-500">{field.label}</dt>
                    <dd className="mt-0.5 font-medium">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <Link
              href={`/resources/${request.id}`}
              className="btn btn-secondary self-start sm:self-center"
            >
              View Details
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function SubmissionsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <p className="eyebrow">Requests</p>
      <h1 className="page-title mt-2">My Requests</h1>
      <p className="mt-3 max-w-2xl text-lg text-zinc-600">
        Track your infrastructure provisioning requests and view deployment
        status.
      </p>
      <div className="mt-10">
        <Suspense fallback={<p className="text-zinc-600">Loading requests…</p>}>
          <RequestList />
        </Suspense>
      </div>
    </main>
  );
}
