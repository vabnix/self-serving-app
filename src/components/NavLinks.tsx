"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/lib/nav";

function NavList({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex items-center gap-1 text-sm font-medium">
      {navLinks.map((link) => {
        const active =
          pathname !== null &&
          (pathname === link.href ||
            link.match.some((prefix) => pathname.startsWith(prefix)));
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 transition-colors ${
              active
                ? "bg-blue-50 text-blue-700"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function NavLinks() {
  return <NavList pathname={usePathname()} />;
}

// Shown while the current path is not yet known (pages rendered on request).
export function NavLinksFallback() {
  return <NavList pathname={null} />;
}
