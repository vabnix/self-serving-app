export type RequestStatus = "deployed" | "building";

export type Field = { label: string; value: string };

export type Component = {
  name: string;
  type: string;
  resourceId: string;
  config: Field[];
};

export type ResourceRequest = {
  id: string;
  name: string;
  templateId: string;
  team: string;
  environment: string;
  // Absent for services that are not sized.
  size?: string;
  status: RequestStatus;
  created: string;
  components: Component[];
  metadata?: {
    subscriptionId: string;
    resourceGroup: string;
    location: string;
    createdAt: string;
  };
  tags: Record<string, string>;
};

// Mock data until the portal is connected to the provisioning pipeline.
export const requests: ResourceRequest[] = [
  {
    id: "sub-001",
    name: "api-gateway-prod",
    templateId: "app-service-sql",
    team: "Backend",
    environment: "Prod",
    size: "Large",
    status: "deployed",
    created: "Oct 10, 2026, 09:30 AM",
    components: [
      {
        name: "api-gateway-prod",
        type: "App Service",
        resourceId:
          "/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/rg-backend-prod/providers/Microsoft.Web/sites/api-gateway-prod",
        config: [
          {
            label: "Default Hostname",
            value: "api-gateway-prod.azurewebsites.net",
          },
          { label: "App Service Plan", value: "P2v3" },
        ],
      },
      {
        name: "db-api",
        type: "SQL Database",
        resourceId:
          "/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/rg-backend-prod/providers/Microsoft.Sql/servers/sql-backend-prod/databases/db-api",
        config: [
          {
            label: "SQL Server",
            value: "sql-backend-prod.database.windows.net",
          },
          { label: "Database Name", value: "db-api" },
          { label: "Edition", value: "Premium" },
          { label: "Service Tier", value: "P1 (1000 DTU)" },
          { label: "Collation", value: "SQL_Latin1_General_CP1_CI_AS" },
          { label: "Backup Retention", value: "35 days" },
          { label: "Geo-Replication", value: "Enabled" },
        ],
      },
    ],
    metadata: {
      subscriptionId: "12345678-1234-1234-1234-123456789012",
      resourceGroup: "rg-backend-prod",
      location: "East US",
      createdAt: "Oct 10, 2026, 11:45 AM",
    },
    tags: {
      owner: "Backend Team",
      costcenter: "ENG-001",
      environment: "production",
      expireson: "2026-12-31",
    },
  },
  {
    id: "sub-002",
    name: "data-lake-dev",
    templateId: "storage",
    team: "Data Engineering",
    environment: "Dev",
    status: "building",
    created: "Oct 11, 2026, 04:15 AM",
    components: [],
    tags: {},
  },
  {
    id: "sub-003",
    name: "secrets-staging",
    templateId: "key-vault",
    team: "Platform",
    environment: "Staging",
    status: "deployed",
    created: "Oct 12, 2026, 02:00 PM",
    components: [
      {
        name: "secrets-staging",
        type: "Key Vault",
        resourceId:
          "/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/rg-platform-staging/providers/Microsoft.KeyVault/vaults/secrets-staging",
        config: [
          { label: "Vault URI", value: "https://secrets-staging.vault.azure.net/" },
          { label: "SKU", value: "Standard" },
        ],
      },
    ],
    metadata: {
      subscriptionId: "12345678-1234-1234-1234-123456789012",
      resourceGroup: "rg-platform-staging",
      location: "East US",
      createdAt: "Oct 12, 2026, 02:10 PM",
    },
    tags: {
      owner: "Platform Team",
      environment: "staging",
    },
  },
];

export function getRequest(id: string) {
  return requests.find((request) => request.id === id);
}
