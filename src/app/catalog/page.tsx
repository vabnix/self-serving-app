import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ResourceCatalog from "@/components/ResourceCatalog";
import { bundles, services } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Resource Catalog",
};

const views = [
  { key: "services", label: "Individual Services", items: services },
  { key: "bundles", label: "Bundles", items: bundles },
] as const;

const categories = [...new Set(services.map((service) => service.category))];

const chipClass =
  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors";
const chipIdle = "bg-white text-zinc-700 ring-1 ring-zinc-950/10 hover:bg-zinc-50";
const chipActive = "bg-blue-600 text-white shadow-sm shadow-blue-600/30";

export default function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <p className="eyebrow">Catalog</p>
      <h1 className="page-title mt-2">Resource Catalog</h1>
      <p className="mt-3 max-w-2xl text-lg text-zinc-600">
        Browse and provision cloud resources from our curated catalog. Request a
        single service, or a bundle of services that are set up to work
        together.
      </p>
      {/* The filters are read per request. Until then the shell shows the
          view switch with no view selected, so it never shows the wrong one. */}
      <Suspense fallback={<CatalogBrowser />}>
        <FilteredCatalog searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function FilteredCatalog({
  searchParams,
}: Pick<PageProps<"/catalog">, "searchParams">) {
  const { view: viewParam, category: categoryParam } = await searchParams;
  const view = views.find((option) => option.key === viewParam) ?? views[0];
  const category =
    view.key === "services" && typeof categoryParam === "string"
      ? categories.find((option) => option === categoryParam)
      : undefined;
  return <CatalogBrowser view={view} category={category} />;
}

function CatalogBrowser({
  view,
  category,
}: {
  view?: (typeof views)[number];
  category?: string;
}) {
  const items = !view
    ? []
    : category
      ? view.items.filter((item) => item.category === category)
      : view.items;

  return (
    <>
      <nav
        aria-label="Catalog view"
        className="mt-10 inline-flex rounded-xl bg-zinc-100 p-1 ring-1 ring-zinc-950/5"
      >
        {views.map((option) => (
          <Link
            key={option.key}
            href={option.key === "services" ? "/catalog" : `/catalog?view=${option.key}`}
            aria-current={option.key === view?.key ? "page" : undefined}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              option.key === view?.key
                ? "bg-white text-blue-700 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {option.label}
            <span className="ml-2 text-xs font-medium text-zinc-500 tabular-nums">
              {option.items.length}
            </span>
          </Link>
        ))}
      </nav>

      {view?.key === "services" && (
        <nav aria-label="Service category" className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/catalog"
            aria-current={!category ? "page" : undefined}
            className={`${chipClass} ${!category ? chipActive : chipIdle}`}
          >
            All
          </Link>
          {categories.map((option) => (
            <Link
              key={option}
              href={`/catalog?category=${encodeURIComponent(option)}`}
              aria-current={option === category ? "page" : undefined}
              className={`${chipClass} ${option === category ? chipActive : chipIdle}`}
            >
              {option}
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-8">
        <ResourceCatalog items={items} />
      </div>
    </>
  );
}
