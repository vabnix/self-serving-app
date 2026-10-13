import { ArrowRight, Box, Shield, Zap } from "lucide-react";
import Link from "next/link";
import IconTile from "@/components/IconTile";

const features = [
  {
    icon: Box,
    title: "Browse Catalog",
    description: "Curated templates for all your infrastructure needs",
  },
  {
    icon: Zap,
    title: "Quick Deploy",
    description: "Fill a form and watch resources provision automatically",
  },
  {
    icon: Shield,
    title: "Compliant",
    description: "Policies and guardrails enforce best practices",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
      <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 shadow-xs ring-1 ring-zinc-950/10">
        <span className="size-1.5 rounded-full bg-blue-600" />
        Azure infrastructure, on demand
      </p>
      <h1 className="mt-6 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
        Self-Serving{" "}
        <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Infrastructure Portal
        </span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-pretty text-zinc-600">
        Provision cloud resources on-demand with standardized templates,
        built-in guardrails, and compliance controls.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/catalog" className="btn btn-primary px-5 py-3">
          Browse Catalog
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link href="/submissions" className="btn btn-secondary px-5 py-3">
          My Requests
        </Link>
      </div>
      <ul className="mt-20 grid w-full gap-5 text-left sm:grid-cols-3">
        {features.map((feature) => (
          <li key={feature.title} className="card p-6">
            <IconTile icon={feature.icon} />
            <h2 className="mt-5 font-semibold">{feature.title}</h2>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600">
              {feature.description}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
