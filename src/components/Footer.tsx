import Link from "next/link";
import { navLinks } from "@/lib/nav";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 text-sm sm:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="font-semibold text-white">About</h2>
            <p className="mt-4 max-w-md leading-6">
              A self-serving portal for provisioning and managing cloud
              infrastructure with built-in guardrails and compliance controls.
            </p>
          </div>
          <div>
            <h2 className="font-semibold text-white">Platform</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.footerLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-12 border-t border-white/10 pt-6 text-xs">
          © 2026 Self Serving Portal. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
