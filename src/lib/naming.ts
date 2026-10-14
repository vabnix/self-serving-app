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

export function generateNames(
  templateId: string,
  input: { name: string; team: string; environment: string },
): GeneratedName[] {
  const workload = slugify(input.name);
  const team = slugify(input.team);
  const env = environmentCodes[input.environment] ?? input.environment;
  if (!workload) return [];
  // The environment and suffix always stay intact when a name is shortened.
  const suffix = uniqueSuffix(`${team}/${workload}/${env}`);

  const names: GeneratedName[] = [];

  switch (templateId) {
    case "app-service-sql":
      names.push(
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
      );
      break;
    case "storage":
      names.push({
        key: "storage_account",
        label: "Storage account",
        value: compact("st", workload, `${env}${suffix}`, 24),
      });
      break;
    case "key-vault":
      names.push({
        key: "key_vault",
        label: "Key Vault",
        value: hyphenated("kv", workload, `${env}-${suffix}`, 24),
      });
      break;
    case "aks-namespace":
      names.push({
        key: "namespace",
        label: "Namespace",
        value: hyphenated("", workload, env, 63),
      });
      break;
  }
  return names;
}
