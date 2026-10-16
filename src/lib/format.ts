import { environments } from "@/lib/request-options";

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function environmentLabel(value: string) {
  return environments.find((option) => option.value === value)?.label ?? value;
}
