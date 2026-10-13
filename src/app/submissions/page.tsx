import { ArrowRight, Box } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import IconTile from "@/components/IconTile";
import StatusBadge from "@/components/StatusBadge";
import { catalog } from "@/lib/catalog";
import { requests } from "@/lib/requests";

export const metadata: Metadata = {
  title: "My Requests",
};

export default function SubmissionsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <p className="eyebrow">Requests</p>
      <h1 className="page-title mt-2">My Requests</h1>
      <p className="mt-3 max-w-2xl text-lg text-zinc-600">
        Track your infrastructure provisioning requests and view deployment
        status.
      </p>
      <ul className="mt-10 flex flex-col gap-4">
        {requests.map((request) => {
          const template = catalog.find(
            (item) => item.id === request.templateId,
          );
          const fields = [
            { label: "Team", value: request.team },
            { label: "Environment", value: request.environment },
            { label: "Size", value: request.size },
            { label: "Created", value: request.created },
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
              {request.status === "deployed" && (
                <Link
                  href={`/resources/${request.id}`}
                  className="btn btn-secondary self-start sm:self-center"
                >
                  View Details
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
