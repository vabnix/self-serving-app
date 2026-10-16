export const teams = ["Service Redesign",
  "Digital Conversion",
  "Partnership", 
  "Observability", 
  "Data Engineering"
];

export const environments = [
  { value: "dev", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "prod", label: "Production" },
];

// Regions developers may choose. Leaving the region blank uses the resource
// group's region, or Central US when the workflow creates the group.
export const regions = [
  { value: "centralus", label: "Central US" },
  { value: "eastus", label: "East US" },
  { value: "eastus2", label: "East US 2" },
  { value: "westus2", label: "West US 2" },
];

// Azure's rule for resource group names: up to 90 letters, numbers,
// underscores, hyphens, periods and parentheses, not ending in a period.
export const resourceGroupPattern = "[\\w.()\\-]{0,89}[\\w()\\-]";

// Production resources may be kept indefinitely; everything else must expire.
export function isExpiryRequired(environment: string) {
  return environment !== "prod";
}

// Today's date as YYYY-MM-DD in the local timezone.
export function today() {
  return new Date().toLocaleDateString("en-CA");
}
