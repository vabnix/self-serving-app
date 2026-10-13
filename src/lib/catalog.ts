import { Cpu, Globe, HardDrive, Lock, type LucideIcon } from "lucide-react";

// A service-specific question on the request form. `name` is the Terraform
// input variable the answer is passed to.
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
};

export const catalog: CatalogItem[] = [
  {
    id: "app-service-sql",
    name: "App Service + SQL Database",
    category: "Web & Database",
    description:
      "Web application with SQL Server database. Best for traditional web apps and APIs.",
    icon: Globe,
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
          { value: "dotnet-8", label: ".NET 8" },
          { value: "node-20", label: "Node.js 20" },
          { value: "python-3.12", label: "Python 3.12" },
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
      },
    ],
  },
  {
    id: "key-vault",
    name: "Key Vault",
    category: "Security",
    description: "Secure storage for secrets, keys, and certificates.",
    icon: Lock,
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
    id: "aks-namespace",
    name: "AKS Namespace",
    category: "Compute",
    description: "A namespace on the shared Kubernetes cluster for your team.",
    icon: Cpu,
    sizing: {
      help: "Sets the CPU and memory quota for the namespace.",
    },
    questions: [
      {
        name: "ingress_hostname",
        label: "Ingress hostname",
        type: "text",
        placeholder: "e.g., orders.dev.example.com",
        help: "Optional. Leave blank if the workload is not exposed over HTTP.",
      },
      {
        name: "enable_workload_identity",
        label: "Create a workload identity",
        type: "boolean",
        help: "Lets pods in the namespace access other Azure resources without secrets.",
      },
    ],
  },
];
