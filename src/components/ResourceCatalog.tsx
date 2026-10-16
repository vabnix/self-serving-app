import { ArrowRight } from "lucide-react";
import Link from "next/link";
import IconTile from "@/components/IconTile";
import { type CatalogItem, findCatalogItem } from "@/lib/catalog";

const sizes = [
  { key: "small", label: "Small:" },
  { key: "medium", label: "Medium:" },
  { key: "large", label: "Large:" },
] as const;

export default function ResourceCatalog({ items }: { items: CatalogItem[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="card card-hover flex flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <IconTile icon={item.icon} />
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {item.category}
            </span>
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-tight">
            {item.name}
          </h2>
          <p className="mt-2 leading-7 text-zinc-600">
            {item.description}
          </p>
          {item.components && (
            <div className="mt-6">
              <h3 className="eyebrow">Includes</h3>
              <ul className="mt-3 flex flex-col gap-2.5">
                {item.components.map((id) => {
                  const component = findCatalogItem(id);
                  if (!component) return null;
                  return (
                    <li key={id} className="flex items-center gap-2.5">
                      <component.icon
                        className="size-4.5 text-blue-600"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      {component.name}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {(item.sizing?.cost || item.costNote) && (
            <div className="mt-6">
              <h3 className="eyebrow">Estimated monthly cost</h3>
              {item.sizing?.cost ? (
                <dl className="mt-3 flex flex-col gap-2">
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
                <p className="mt-3 font-medium">{item.costNote}</p>
              )}
            </div>
          )}
          <div className="mt-auto pt-6">
            <Link href={`/request/${item.id}`} className="btn btn-primary w-full py-3 text-base">
              Request Resource
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
