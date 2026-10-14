export const teams = ["Platform", "Backend", "Data Engineering"];

export const environments = [
  { value: "dev", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "prod", label: "Production" },
];

export const sizes = [
  { value: "small", label: "Small (Dev)" },
  { value: "medium", label: "Medium (Staging)" },
  { value: "large", label: "Large (Prod)" },
] as const;

export type Size = (typeof sizes)[number]["value"];

// Production resources may be kept indefinitely; everything else must expire.
export function isExpiryRequired(environment: string) {
  return environment !== "prod";
}

// Today's date as YYYY-MM-DD in the local timezone.
export function today() {
  return new Date().toLocaleDateString("en-CA");
}
