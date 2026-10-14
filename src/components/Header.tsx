import { Layers } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import NavLinks, { NavLinksFallback } from "@/components/NavLinks";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-950/5 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-sm shadow-blue-600/30">
            <Layers className="size-4.5" aria-hidden />
          </span>
          <span className="font-semibold tracking-tight max-sm:sr-only">
            Self Serving Portal
          </span>
        </Link>
        <Suspense fallback={<NavLinksFallback />}>
          <NavLinks />
        </Suspense>
      </div>
    </header>
  );
}
