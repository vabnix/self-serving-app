import {
  Activity,
  Boxes,
  Container,
  Database,
  Earth,
  Globe,
  HardDrive,
  Layers,
  Lock,
  Package,
  Radio,
  Ship,
  Webhook,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { TerraformInputs } from "@/lib/requests";

// A service-specific question on the request form. `name` is the Terraform
// input variable the answer is passed to, so it must be unique across the
// catalog: bundles combine the questions of several services.
type QuestionBase = { name: string; label: string; help?: string };

export type Question = QuestionBase &
  (
    | { type: "select"; options: { value: string; label: string }[] }
    | { type: "text"; required?: boolean; placeholder?: string; pattern?: string }
    | { type: "number"; min: number; max: number; defaultValue: number }
    | { type: "boolean"; defaultValue?: boolean }
  );

export type CatalogItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: LucideIcon;
  // Set only when a t-shirt size changes what gets provisioned. `help` says
  // what the size controls; `cost` is the estimated monthly cost per size.
  sizing?: {
    help: string;
    cost?: { small: string; medium: string; large: string };
  };
  // Pricing shown for services that have no per-size cost.
  costNote?: string;
  questions: Question[];
  // True for services created inside an Azure resource group. The requester
  // names the group on the form.
  needsResourceGroup?: boolean;
  // True once a Terraform template exists for the service. Requests for other
  // services are saved but the provisioning pipeline is not started.
  provisionable?: boolean;
  // For bundles: the IDs of the services the bundle provisions together.
  components?: string[];
  // Checks combinations of answers that Azure would reject, returning an
  // error message. `asked` says whether a question is on this item's form,
  // since a bundle may answer some questions itself.
  validate?: Validator;
};

type Validator = (
  inputs: TerraformInputs,
  asked: (question: string) => boolean,
) => string | undefined;

// Cost figures are rough estimates for a typical setup in a US region, in USD.
// Check them against the Azure pricing calculator before relying on them.
export const services: CatalogItem[] = [
  {
    id: "app-service-sql",
    name: "App Service + SQL Database",
    category: "Web & Database",
    description:
      "Web application with SQL Server database. Best for traditional web apps and APIs.",
    icon: Globe,
    needsResourceGroup: true,
    sizing: {
      help: "Sets the App Service plan and SQL database tier.",
      cost: {
        small: "$50-100/month",
        medium: "$200-400/month",
        large: "$800-1500/month",
      },
    },
    questions: [
      {
        name: "runtime_stack",
        label: "Runtime stack",
        type: "select",
        options: [
          { value: "dotnet-9", label: ".NET 9" },
          { value: "dotnet-8", label: ".NET 8" },
          { value: "node-22", label: "Node.js 22" },
          { value: "node-20", label: "Node.js 20" },
          { value: "python-3.12", label: "Python 3.12" },
          { value: "java-21", label: "Java 21" },
          { value: "java-17", label: "Java 17" },
        ],
      },
      {
        name: "health_check_path",
        label: "Health check path",
        type: "text",
        placeholder: "e.g., /health",
        pattern: "/.*",
        help: "Optional. Path the platform pings to check the app is up.",
      },
    ],
  },
  {
    id: "storage",
    name: "Azure Storage Account",
    category: "Storage",
    description:
      "Blob storage for files, tables for NoSQL, queues for messaging.",
    icon: HardDrive,
    needsResourceGroup: true,
    provisionable: true,
    costNote: "Billed by usage: data stored and operations.",
    questions: [
      {
        name: "replication",
        label: "Redundancy",
        type: "select",
        options: [
          { value: "LRS", label: "Locally redundant (LRS)" },
          { value: "ZRS", label: "Zone redundant (ZRS)" },
          { value: "GRS", label: "Geo redundant (GRS)" },
        ],
      },
      {
        name: "access_tier",
        label: "Access tier",
        type: "select",
        options: [
          { value: "Hot", label: "Hot (frequent access)" },
          { value: "Cool", label: "Cool (infrequent access)" },
        ],
      },
      {
        name: "containers",
        label: "Blob containers",
        type: "text",
        placeholder: "e.g., uploads, exports",
        pattern: "[a-z0-9\\-]+(\\s*,\\s*[a-z0-9\\-]+)*",
        help: "Optional. Comma-separated container names to create.",
      },
      {
        name: "enable_data_lake",
        label: "Enable Data Lake (hierarchical namespace)",
        type: "boolean",
        help: "Cannot be changed after the account is created.",
      },
      {
        name: "enable_versioning",
        label: "Enable blob versioning",
        type: "boolean",
        help: "Not available with Data Lake.",
      },
    ],
    validate: (inputs) =>
      inputs.enable_data_lake && inputs.enable_versioning
        ? "Blob versioning is not available with Data Lake. Turn off one of them."
        : undefined,
  },
  {
    id: "key-vault",
    name: "Key Vault",
    category: "Security",
    description: "Secure storage for secrets, keys, and certificates.",
    icon: Lock,
    needsResourceGroup: true,
    costNote: "$0.50/month",
    questions: [
      {
        name: "secrets_reader_group",
        label: "Secrets access group",
        type: "text",
        required: true,
        placeholder: "e.g., sg-payments-developers",
        help: "Entra ID group that gets read access to secrets.",
      },
      {
        name: "soft_delete_retention_days",
        label: "Soft-delete retention (days)",
        type: "number",
        min: 7,
        max: 90,
        defaultValue: 90,
      },
      {
        name: "purge_protection",
        label: "Enable purge protection",
        type: "boolean",
        defaultValue: true,
        help: "Cannot be turned off once enabled.",
      },
    ],
  },
  {
    id: "apim",
    name: "API Management",
    category: "Integration",
    description:
      "Gateway to publish, secure and monitor APIs, with a developer portal.",
    icon: Webhook,
    needsResourceGroup: true,
    sizing: {
      help: "Sets the tier: Developer (no SLA), Basic v2 or Standard v2.",
      cost: {
        small: "$50/month",
        medium: "$150/month",
        large: "$700/month",
      },
    },
    questions: [
      {
        name: "apim_publisher_name",
        label: "Publisher name",
        type: "text",
        required: true,
        placeholder: "e.g., Payments Team",
        help: "Shown in the developer portal and in emails to API consumers.",
      },
      {
        name: "apim_publisher_email",
        label: "Publisher email",
        type: "text",
        required: true,
        placeholder: "e.g., payments@example.com",
        pattern: "[^@\\s]+@[^@\\s]+\\.[^@\\s]+",
        help: "Receives notifications from API Management.",
      },
    ],
  },
  {
    id: "container-app",
    name: "Azure Container App",
    category: "Compute",
    description:
      "Serverless containers for APIs, web apps and background workers, with autoscaling.",
    icon: Container,
    needsResourceGroup: true,
    sizing: {
      help: "Sets the CPU and memory of each replica.",
      cost: {
        small: "$0-20/month",
        medium: "$50-150/month",
        large: "$200-600/month",
      },
    },
    questions: [
      {
        name: "container_image",
        label: "Container image",
        type: "text",
        placeholder: "e.g., myregistry.azurecr.io/orders-api:1.0",
        help: "Optional. Starts with a sample image when left blank.",
      },
      {
        name: "container_port",
        label: "Target port",
        type: "number",
        min: 1,
        max: 65535,
        defaultValue: 8080,
        help: "The port the container listens on.",
      },
      {
        name: "container_ingress",
        label: "Ingress",
        type: "select",
        options: [
          { value: "external", label: "External (public internet)" },
          { value: "none", label: "None (background worker)" },
        ],
      },
      {
        name: "container_min_replicas",
        label: "Minimum replicas",
        type: "number",
        min: 0,
        max: 10,
        defaultValue: 0,
        help: "0 lets the app scale to zero when idle.",
      },
      {
        name: "container_max_replicas",
        label: "Maximum replicas",
        type: "number",
        min: 1,
        max: 30,
        defaultValue: 3,
      },
    ],
    validate: (inputs) =>
      Number(inputs.container_min_replicas) > Number(inputs.container_max_replicas)
        ? "Minimum replicas cannot be more than maximum replicas."
        : undefined,
  },
  {
    id: "container-registry",
    name: "Azure Container Registry",
    category: "Containers",
    description: "Private registry for container images and Helm charts.",
    icon: Package,
    needsResourceGroup: true,
    sizing: {
      help: "Sets the tier: Basic, Standard or Premium.",
      cost: {
        small: "$5/month",
        medium: "$20/month",
        large: "$50/month",
      },
    },
    questions: [
      {
        name: "acr_admin_enabled",
        label: "Enable admin user",
        type: "boolean",
        help: "Not recommended. Use managed identities to pull images instead.",
      },
    ],
  },
  {
    id: "functions",
    name: "Azure Functions",
    category: "Compute",
    description:
      "Event-driven serverless functions that run on triggers, schedules and HTTP calls.",
    icon: Zap,
    needsResourceGroup: true,
    sizing: {
      help: "Sets the hosting plan: Flex Consumption, Premium EP1 or Premium EP2.",
      cost: {
        small: "$0-10/month",
        medium: "$150-200/month",
        large: "$300-400/month",
      },
    },
    questions: [
      {
        name: "functions_runtime",
        label: "Runtime stack",
        type: "select",
        options: [
          { value: "dotnet-isolated-8", label: ".NET 8 (isolated)" },
          { value: "node-22", label: "Node.js 22" },
          { value: "node-20", label: "Node.js 20" },
          { value: "python-3.12", label: "Python 3.12" },
          { value: "python-3.11", label: "Python 3.11" },
          { value: "java-17", label: "Java 17" },
        ],
      },
    ],
  },
  {
    id: "postgresql",
    name: "Azure Database for PostgreSQL",
    category: "Database",
    description: "Managed PostgreSQL Flexible Server with automatic backups.",
    icon: Database,
    needsResourceGroup: true,
    sizing: {
      help: "Sets the compute tier: Burstable B1ms, General Purpose 2 or 4 vCores.",
      cost: {
        small: "$15-25/month",
        medium: "$150-200/month",
        large: "$350-450/month",
      },
    },
    questions: [
      {
        name: "postgres_version",
        label: "PostgreSQL version",
        type: "select",
        options: [
          { value: "17", label: "17" },
          { value: "16", label: "16" },
          { value: "15", label: "15" },
        ],
      },
      {
        name: "postgres_storage_gb",
        label: "Storage",
        type: "select",
        // Azure offers fixed storage sizes.
        options: ["32", "64", "128", "256", "512", "1024", "2048"].map(
          (gb) => ({ value: gb, label: `${gb} GB` }),
        ),
      },
      {
        name: "postgres_admin_group",
        label: "Database admin group",
        type: "text",
        required: true,
        placeholder: "e.g., sg-orders-db-admins",
        help: "Entra ID group that administers the server. Password sign-in is turned off.",
      },
      {
        name: "postgres_database_name",
        label: "Database name",
        type: "text",
        placeholder: "e.g., orders",
        pattern: "[a-z_][a-z0-9_]{0,62}",
        help: "Optional. Lowercase letters, numbers and underscores.",
      },
      {
        name: "postgres_high_availability",
        label: "Enable zone-redundant high availability",
        type: "boolean",
        help: "Adds a standby server in another zone. Roughly doubles the cost. Not available on Small.",
      },
    ],
    validate: (inputs) =>
      inputs.postgres_high_availability && inputs.size === "small"
        ? "High availability is not available on the Small (Burstable) tier. Choose Medium or Large."
        : undefined,
  },
  {
    id: "event-grid",
    name: "Azure Event Grid",
    category: "Integration",
    description:
      "Event routing between services with push delivery and filtering.",
    icon: Radio,
    needsResourceGroup: true,
    costNote: "Billed per operation; the first 100,000 a month are free.",
    questions: [
      {
        name: "eventgrid_source",
        label: "Event source",
        type: "select",
        options: [
          { value: "custom", label: "Custom topic (your apps publish events)" },
          { value: "storage", label: "Storage account (blob created or deleted)" },
        ],
      },
      {
        name: "eventgrid_source_storage_account",
        label: "Source storage account",
        type: "text",
        placeholder: "e.g., stordersdev1a2b",
        pattern: "[a-z0-9]{3,24}",
        help: "Required for storage events. The account whose blob events are sent.",
      },
      {
        name: "eventgrid_schema",
        label: "Event schema",
        type: "select",
        options: [
          { value: "CloudEventSchemaV1_0", label: "CloudEvents 1.0" },
          { value: "EventGridSchema", label: "Event Grid schema" },
        ],
      },
      {
        name: "eventgrid_disable_local_auth",
        label: "Require Entra ID authentication",
        type: "boolean",
        defaultValue: true,
        help: "Turns off access keys, so publishers must use Entra ID.",
      },
    ],
    validate: (inputs, asked) =>
      inputs.eventgrid_source === "storage" &&
      asked("eventgrid_source_storage_account") &&
      !inputs.eventgrid_source_storage_account
        ? "Enter the storage account whose events should be sent."
        : undefined,
  },
  {
    id: "app-insights",
    name: "Application Insights",
    category: "Monitoring",
    description:
      "Application performance monitoring, logs and distributed tracing.",
    icon: Activity,
    needsResourceGroup: true,
    costNote: "Billed by data ingested; the first 5 GB a month are free.",
    questions: [
      {
        name: "appinsights_retention_days",
        label: "Data retention",
        type: "select",
        options: [
          { value: "30", label: "30 days" },
          { value: "90", label: "90 days" },
          { value: "180", label: "180 days" },
          { value: "365", label: "1 year" },
        ],
      },
      {
        name: "appinsights_daily_cap_gb",
        label: "Daily data cap (GB)",
        type: "number",
        min: 1,
        max: 100,
        defaultValue: 5,
        help: "Stops ingestion for the day once reached, to control cost.",
      },
    ],
  },
  {
    id: "front-door",
    name: "Azure Front Door",
    category: "Networking",
    description:
      "Global entry point with CDN caching, TLS and a web application firewall.",
    icon: Earth,
    needsResourceGroup: true,
    sizing: {
      help: "Sets the tier: Standard, or Premium with managed WAF rules and Private Link.",
      cost: {
        small: "$35/month plus traffic",
        medium: "$35/month plus traffic",
        large: "$330/month plus traffic",
      },
    },
    questions: [
      {
        name: "frontdoor_origin_hostname",
        label: "Origin hostname",
        type: "text",
        required: true,
        placeholder: "e.g., app-orders-dev.azurewebsites.net",
        help: "The backend that Front Door forwards traffic to.",
      },
      {
        name: "frontdoor_custom_domain",
        label: "Custom domain",
        type: "text",
        placeholder: "e.g., orders.example.com",
        pattern: "([a-z0-9\\-]+\\.)+[a-z]{2,}",
        help: "Optional. Needs a DNS record before it goes live.",
      },
      {
        name: "frontdoor_waf",
        label: "Enable web application firewall",
        type: "boolean",
        defaultValue: true,
        help: "Standard supports custom rules only. Microsoft-managed rule sets need Premium (Large).",
      },
    ],
  },
  {
    id: "aks",
    name: "Azure Kubernetes Service",
    category: "Containers",
    description: "Dedicated managed Kubernetes cluster for your team.",
    icon: Ship,
    needsResourceGroup: true,
    sizing: {
      help: "Sets the node size and cluster tier (Free for small, Standard otherwise).",
      cost: {
        small: "$150-250/month",
        medium: "$400-700/month",
        large: "$1,200-2,500/month",
      },
    },
    questions: [
      {
        name: "aks_node_count",
        label: "Node count",
        type: "number",
        min: 1,
        max: 20,
        defaultValue: 2,
        help: "Nodes in the default pool. The minimum when autoscaling is on.",
      },
      {
        name: "aks_max_nodes",
        label: "Maximum nodes",
        type: "number",
        min: 1,
        max: 100,
        defaultValue: 5,
        help: "The most the autoscaler may add. Ignored when autoscaling is off.",
      },
      {
        name: "aks_admin_group",
        label: "Cluster admin group",
        type: "text",
        required: true,
        placeholder: "e.g., sg-platform-aks-admins",
        help: "Entra ID group with cluster admin rights. Local accounts are turned off.",
      },
      {
        name: "aks_autoscaling",
        label: "Enable cluster autoscaler",
        type: "boolean",
        defaultValue: true,
      },
      {
        name: "aks_workload_identity",
        label: "Enable workload identity",
        type: "boolean",
        defaultValue: true,
        help: "Lets pods access other Azure resources without secrets.",
      },
    ],
    validate: (inputs) =>
      inputs.aks_autoscaling &&
      Number(inputs.aks_max_nodes) < Number(inputs.aks_node_count)
        ? "Maximum nodes cannot be less than the node count."
        : undefined,
  },
];

const serviceById = new Map(services.map((service) => [service.id, service]));

export function findService(id: string) {
  return serviceById.get(id);
}

function service(id: string) {
  const found = findService(id);
  if (!found) throw new Error(`Unknown catalog service "${id}".`);
  return found;
}

// A bundle provisions several services together and asks for their settings
// on one form. `omit` drops questions the bundle answers itself, such as an
// origin that is another service in the bundle.
function bundle(
  item: Omit<CatalogItem, "questions" | "needsResourceGroup" | "components"> & {
    components: string[];
    omit?: string[];
  },
): CatalogItem {
  const { omit = [], ...rest } = item;
  const questions = item.components
    .flatMap((id) => service(id).questions)
    .filter((question) => !omit.includes(question.name));
  const validators = item.components.flatMap((id) => service(id).validate ?? []);
  const validate: Validator = (inputs, asked) =>
    validators.map((check) => check(inputs, asked)).find(Boolean);
  return { ...rest, questions, validate, needsResourceGroup: true };
}

export const bundles: CatalogItem[] = [
  bundle({
    id: "bundle-container-microservice",
    name: "Containerized Microservice",
    category: "Bundle",
    description:
      "A Container App that pulls from its own registry, monitored by Application Insights.",
    icon: Boxes,
    components: ["container-app", "container-registry", "app-insights"],
    // The app pulls from the registry with a managed identity.
    omit: ["acr_admin_enabled"],
    sizing: {
      help: "Sets the tier of each service in the bundle.",
      cost: {
        small: "$5-30/month",
        medium: "$75-200/month",
        large: "$250-700/month",
      },
    },
  }),
  bundle({
    id: "bundle-serverless-api",
    name: "Serverless API",
    category: "Bundle",
    description:
      "Azure Functions with a storage account for data, monitored by Application Insights.",
    icon: Zap,
    components: ["functions", "storage", "app-insights"],
    sizing: {
      help: "Sets the tier of each service in the bundle.",
      cost: {
        small: "$0-20/month",
        medium: "$160-250/month",
        large: "$320-500/month",
      },
    },
  }),
  bundle({
    id: "bundle-api-platform",
    name: "Managed API Platform",
    category: "Bundle",
    description:
      "API Management in front of a Container App backend, monitored by Application Insights.",
    icon: Webhook,
    components: ["apim", "container-app", "app-insights"],
    // API Management must reach the app, so its ingress is always external.
    omit: ["container_ingress"],
    sizing: {
      help: "Sets the tier of each service in the bundle.",
      cost: {
        small: "$50-80/month",
        medium: "$200-350/month",
        large: "$900-1,400/month",
      },
    },
  }),
  bundle({
    id: "bundle-event-driven",
    name: "Event-Driven Processing",
    category: "Bundle",
    description:
      "Event Grid delivering events to Azure Functions, with a storage account for results.",
    icon: Radio,
    components: ["event-grid", "functions", "storage"],
    // Storage events come from the bundle's own storage account.
    omit: ["eventgrid_source_storage_account"],
    sizing: {
      help: "Sets the tier of each service in the bundle.",
      cost: {
        small: "$0-20/month",
        medium: "$160-250/month",
        large: "$320-500/month",
      },
    },
  }),
  bundle({
    id: "bundle-web-app-database",
    name: "Web App with Database",
    category: "Bundle",
    description:
      "A Container App with a PostgreSQL database, monitored by Application Insights.",
    icon: Database,
    components: ["container-app", "postgresql", "app-insights"],
    sizing: {
      help: "Sets the tier of each service in the bundle.",
      cost: {
        small: "$15-50/month",
        medium: "$200-400/month",
        large: "$600-1,100/month",
      },
    },
  }),
  bundle({
    id: "bundle-global-web",
    name: "Global Web Front End",
    category: "Bundle",
    description:
      "Azure Front Door with WAF in front of a Container App, served worldwide.",
    icon: Earth,
    components: ["front-door", "container-app"],
    // Front Door forwards to the bundle's Container App, whose ingress is
    // always external.
    omit: ["frontdoor_origin_hostname", "container_ingress"],
    sizing: {
      help: "Sets the tier of each service in the bundle.",
      cost: {
        small: "$35-60/month plus traffic",
        medium: "$85-200/month plus traffic",
        large: "$530-950/month plus traffic",
      },
    },
  }),
  bundle({
    id: "bundle-kubernetes-platform",
    name: "Kubernetes Platform",
    category: "Bundle",
    description:
      "An AKS cluster with its own container registry, monitored by Application Insights.",
    icon: Layers,
    components: ["aks", "container-registry", "app-insights"],
    // The cluster pulls from the registry with its kubelet identity.
    omit: ["acr_admin_enabled"],
    sizing: {
      help: "Sets the tier of each service in the bundle.",
      cost: {
        small: "$155-260/month",
        medium: "$420-750/month",
        large: "$1,250-2,600/month",
      },
    },
  }),
];

export const catalog: CatalogItem[] = [...services, ...bundles];

export function findCatalogItem(id: string) {
  return catalog.find((item) => item.id === id);
}

// The services a request provisions: a bundle's components, or the service
// itself. Falls back to the ID for items no longer in the catalog.
export function serviceIds(templateId: string) {
  return findCatalogItem(templateId)?.components ?? [templateId];
}

// The item's questions grouped by service, for the request form. A service
// has one untitled group.
export function questionGroups(item: CatalogItem) {
  if (!item.components) return [{ title: undefined, questions: item.questions }];
  return item.components
    .map((id) => ({
      title: service(id).name,
      questions: service(id).questions.filter((question) =>
        item.questions.includes(question),
      ),
    }))
    .filter((group) => group.questions.length > 0);
}
