import type { LucideIcon } from "lucide-react";

const sizes = {
  md: { tile: "size-14 rounded-2xl", icon: "size-7" },
  lg: { tile: "size-16 rounded-2xl", icon: "size-8" },
};

export default function IconTile({
  icon: Icon,
  size = "md",
}: {
  icon: LucideIcon;
  size?: keyof typeof sizes;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-blue-50 text-blue-600 ring-1 ring-blue-600/10 ring-inset ${sizes[size].tile}`}
    >
      <Icon className={sizes[size].icon} strokeWidth={1.75} aria-hidden />
    </span>
  );
}
