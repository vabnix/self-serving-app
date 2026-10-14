import { LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

function initials(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="flex items-center gap-2 border-l border-zinc-950/10 pl-3">
      <span
        className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700"
        aria-hidden
      >
        {initials(user.name)}
      </span>
      <span className="text-sm font-medium text-zinc-700 max-md:sr-only" title={user.email}>
        {user.name}
      </span>
      {user.signOutUrl && (
        // A plain link: /.auth/logout is served by App Service, not Next.js.
        <a
          href={user.signOutUrl}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
        >
          <LogOut className="size-4" aria-hidden />
          <span className="max-sm:sr-only">Sign out</span>
        </a>
      )}
    </div>
  );
}
