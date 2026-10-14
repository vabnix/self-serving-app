import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import IconTile from "@/components/IconTile";
import RequestForm from "@/components/RequestForm";
import { catalog } from "@/lib/catalog";

export function generateStaticParams() {
  return catalog.map((item) => ({ template: item.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/request/[template]">): Promise<Metadata> {
  const { template } = await params;
  const item = catalog.find((item) => item.id === template);
  return { title: item && `Request ${item.name}` };
}

export default async function RequestPage({
  params,
}: PageProps<"/request/[template]">) {
  const { template } = await params;
  const item = catalog.find((item) => item.id === template);
  if (!item) notFound();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/catalog"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-blue-700"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to Catalog
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <IconTile icon={item.icon} size="lg" />
        <div>
          <p className="eyebrow text-blue-700">{item.category}</p>
          <h1 className="page-title mt-1">{item.name}</h1>
          <p className="mt-2 text-lg text-zinc-600">{item.description}</p>
        </div>
      </div>

      <div className="mt-10">
        <RequestForm
          templateId={item.id}
          sizing={item.sizing}
          costNote={item.costNote}
          provisionable={item.provisionable ?? false}
          needsResourceGroup={item.needsResourceGroup ?? false}
          questions={item.questions}
        />
      </div>
    </main>
  );
}
