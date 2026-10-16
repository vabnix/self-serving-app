// Generates Azure resource names from what the developer typed, so they never
// need to know the naming standard. The convention below is a placeholder
// based on Microsoft's Cloud Adoption Framework abbreviations
// (<type>-<workload>-<environment>); replace it with the organisation's own.

export type GeneratedName = { key: string; label: string; value: string };

const environmentCodes: Record<string, string> = {
  dev: "dev",
  staging: "stg",
  prod: "prod",
};

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Four characters derived from the request, appended to names that must be
// unique across all of Azure so they do not collide with other organisations.
function uniqueSuffix(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index++) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
  }
  return (hash >>> 0).toString(36).padStart(4, "0").slice(-4);
}

// <prefix>-<workload>-<env>, shortening the workload to fit Azure's limit.
function hyphenated(prefix: string, workload: string, env: string, max: number) {
  const room = max - env.length - 1 - (prefix ? prefix.length + 1 : 0);
  const short = workload.slice(0, room).replace(/-+$/, "");
  return [prefix, short, env].filter(Boolean).join("-");
}

// <prefix><workload><env> for resources that allow letters and numbers only.
function compact(prefix: string, workload: string, env: string, max: number) {
  const room = max - prefix.length - env.length;
  return prefix + workload.replace(/-/g, "").slice(0, room) + env;
}

type NameParts = { workload: string; env: string; suffix: string };

// The resource names each catalog service creates.
const serviceNames: Record<string, (parts: NameParts) => GeneratedName[]> = {
  "app-service-sql": ({ workload, env, suffix }) => [
    {
      key: "app_service_plan",
      label: "App Service plan",
      value: hyphenated("asp", workload, env, 60),
    },
    {
      key: "app_service",
      label: "App Service",
      value: hyphenated("app", workload, `${env}-${suffix}`, 60),
    },
    {
      key: "sql_server",
      label: "SQL server",
      value: hyphenated("sql", workload, `${env}-${suffix}`, 63),
    },
    {
      key: "sql_database",
      label: "SQL database",
      value: hyphenated("sqldb", workload, env, 128),
    },
  ],
  storage: ({ workload, env, suffix }) => [
    {
      key: "storage_account",
      label: "Storage account",
      value: compact("st", workload, `${env}${suffix}`, 24),
    },
  ],
  "key-vault": ({ workload, env, suffix }) => [
    {
      key: "key_vault",
      label: "Key Vault",
      value: hyphenated("kv", workload, `${env}-${suffix}`, 24),
    },
  ],
  apim: ({ workload, env, suffix }) => [
    {
      key: "api_management",
      label: "API Management",
      value: hyphenated("apim", workload, `${env}-${suffix}`, 50),
    },
  ],
  "container-app": ({ workload, env }) => [
    {
      key: "container_app_environment",
      label: "Container Apps environment",
      value: hyphenated("cae", workload, env, 60),
    },
    {
      key: "container_app",
      label: "Container App",
      value: hyphenated("ca", workload, env, 32),
    },
  ],
  "container-registry": ({ workload, env, suffix }) => [
    {
      key: "container_registry",
      label: "Container registry",
      value: compact("cr", workload, `${env}${suffix}`, 50),
    },
  ],
  functions: ({ workload, env, suffix }) => [
    {
      key: "function_app",
      label: "Function App",
      value: hyphenated("func", workload, `${env}-${suffix}`, 60),
    },
    {
      key: "function_plan",
      label: "Function App plan",
      value: hyphenated("asp-func", workload, env, 60),
    },
    {
      key: "function_storage",
      label: "Function App storage account",
      value: compact("stfn", workload, `${env}${suffix}`, 24),
    },
  ],
  postgresql: ({ workload, env, suffix }) => [
    {
      key: "postgresql_server",
      label: "PostgreSQL server",
      value: hyphenated("psql", workload, `${env}-${suffix}`, 63),
    },
  ],
  "event-grid": ({ workload, env }) => [
    {
      key: "event_grid_topic",
      label: "Event Grid topic",
      value: hyphenated("evgt", workload, env, 50),
    },
  ],
  "app-insights": ({ workload, env }) => [
    {
      key: "application_insights",
      label: "Application Insights",
      value: hyphenated("appi", workload, env, 255),
    },
    {
      key: "log_analytics_workspace",
      label: "Log Analytics workspace",
      value: hyphenated("log", workload, env, 63),
    },
  ],
  "front-door": ({ workload, env, suffix }) => [
    {
      key: "front_door_profile",
      label: "Front Door profile",
      value: hyphenated("afd", workload, env, 90),
    },
    {
      key: "front_door_endpoint",
      label: "Front Door endpoint",
      value: hyphenated("fde", workload, `${env}-${suffix}`, 46),
    },
  ],
  aks: ({ workload, env }) => [
    {
      key: "aks_cluster",
      label: "AKS cluster",
      value: hyphenated("aks", workload, env, 63),
    },
  ],
};

// The names for every resource the given services create. A bundle passes
// all of its services.
export function generateNames(
  serviceIds: string[],
  input: { name: string; team: string; environment: string },
): GeneratedName[] {
  const workload = slugify(input.name);
  const team = slugify(input.team);
  const env = environmentCodes[input.environment] ?? input.environment;
  if (!workload) return [];
  // The environment and suffix always stay intact when a name is shortened.
  const suffix = uniqueSuffix(`${team}/${workload}/${env}`);

  return serviceIds.flatMap(
    (id) => serviceNames[id]?.({ workload, env, suffix }) ?? [],
  );
}
