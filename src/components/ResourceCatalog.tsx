import { ArrowRight } from "lucide-react";
import Link from "next/link";
import IconTile from "@/components/IconTile";
import { catalog } from "@/lib/catalog";

const sizes = [
  { key: "small", label: "Small" },
  { key: "medium", label: "Medium" },
  { key: "large", label: "Large" },
] as const;

export default function ResourceCatalog() {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {catalog.map((item) => (
        <li key={item.id} className="card card-hover flex flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <IconTile icon={item.icon} />
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-600/15 ring-inset">
              {item.category}
            </span>
          </div>
          <h2 className="mt-5 text-lg font-semibold tracking-tight">
            {item.name}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-zinc-600">
            {item.description}
          </p>
          {(item.sizing?.cost || item.costNote) && (
            <div className="mt-5 rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-950/5 ring-inset">
              <h3 className="eyebrow">Estimated monthly cost</h3>
              {item.sizing?.cost ? (
                <dl className="mt-3 flex flex-col gap-1.5 text-sm">
                  {sizes.map((size) => (
                    <div key={size.key} className="flex justify-between">
                      <dt className="text-zinc-600">{size.label}</dt>
                      <dd className="font-medium tabular-nums">
                        {item.sizing?.cost?.[size.key]}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-sm font-medium">{item.costNote}</p>
              )}
            </div>
          )}
          <div className="mt-auto pt-6">
            <Link href={`/request/${item.id}`} className="btn btn-primary w-full">
              Request Resource
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
