import type { RequestStatus } from "@/lib/requests";

const styles: Record<
  RequestStatus,
  { label: string; badge: string; dot: string }
> = {
  submitted: {
    label: "Submitted",
    badge: "bg-zinc-100 text-zinc-700 ring-zinc-600/20",
    dot: "bg-zinc-500",
  },
  building: {
    label: "Building",
    badge: "bg-blue-50 text-blue-700 ring-blue-600/20",
    dot: "bg-blue-500 motion-safe:animate-pulse",
  },
  deployed: {
    label: "Deployed",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  failed: {
    label: "Failed",
    badge: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-500",
  },
};

export default function StatusBadge({ status }: { status: RequestStatus }) {
  const style = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style.badge}`}
    >
      <span className={`size-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
