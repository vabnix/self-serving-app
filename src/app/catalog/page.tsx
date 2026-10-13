import type { Metadata } from "next";
import ResourceCatalog from "@/components/ResourceCatalog";

export const metadata: Metadata = {
  title: "Resource Catalog",
};

export default function CatalogPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <p className="eyebrow">Catalog</p>
      <h1 className="page-title mt-2">Resource Catalog</h1>
      <p className="mt-3 max-w-2xl text-lg text-zinc-600">
        Browse and provision cloud resources from our curated catalog. Select a
        template to get started.
      </p>
      <div className="mt-10">
        <ResourceCatalog />
      </div>
    </main>
  );
}
