import type { LucideIcon } from "lucide-react";

const sizes = {
  md: { tile: "size-11 rounded-xl", icon: "size-5" },
  lg: { tile: "size-14 rounded-2xl", icon: "size-7" },
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
      className={`flex shrink-0 items-center justify-center bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-600/25 ${sizes[size].tile}`}
    >
      <Icon className={sizes[size].icon} aria-hidden />
    </span>
  );
}
