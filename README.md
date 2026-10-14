# Self-Service Cloud Portal

A self-service portal that developers use to request approved Azure resources
themselves. Each request is provisioned through Terraform in a GitHub Actions
pipeline, with no ticket to the platform team.

## Business objective

Developers today wait on the platform/cloud team to create infrastructure. This
portal moves that work to them while keeping control with the platform team:

- **Self-service:** developers pick a service from a curated catalog, answer a
  few questions and get a running resource in minutes.
- **Standardization:** every resource comes from a Terraform template owned by
  the platform team, with consistent naming and tagging.
- **Governance:** users sign in with Microsoft Entra ID, every request is
  recorded with its requester and status, and the pipeline signs in to Azure
  through OIDC federation, so no cloud secrets are stored.
- **Lifecycle:** the same portal deletes a resource and tears down what its
  request created.

## How it works

1. A developer signs in (Entra ID through App Service authentication) and picks
   a service from the catalog: App Service + SQL Database, Storage Account,
   Key Vault or AKS Namespace.
2. The request form collects service-specific inputs, which are saved to the
   database (Azure SQL, or SQLite locally).
3. The portal starts the `provision.yml` GitHub Actions workflow, which runs
   `terraform plan` and `apply` (or `destroy`) for that template. State is kept
   per request in Azure Storage.
4. The workflow reports the result and Terraform outputs back to the portal
   with a one-time token, and the request status updates to deployed, failed
   or deleted.

Planned next: a policy scan and an approval gate in the pipeline.

## Tech stack

- Next.js 16, React 19, TypeScript, Tailwind CSS
- Azure App Service (Linux), Azure SQL Database, Azure Storage
- GitHub Actions + Terraform, Azure OIDC workload identity federation

## Cost

**Azure running cost: about $0/month.** The PoC runs on free tiers:

| Resource | SKU | Cost |
| --- | --- | --- |
| App Service plan | F1 (Free), Linux | $0 |
| Azure SQL Database | Free offer, auto-pauses when the free limit is used | $0 |
| Storage account (Terraform state) | Standard_LRS | Cents per month |
| GitHub Actions | Free minutes | $0 |

Resources that developers request through the portal are billed separately,
at their own SKU.

**Build effort: about 2 days (October 13–14, 2026)**, by one engineer working
with an AI coding assistant (Claude Code), at roughly **$18–20 in Claude
usage**. That covered the portal, the pipeline, the Terraform templates and
the Azure setup scripts.

The free tiers trade cost for performance: the F1 app sleeps when idle, so the
first request after a pause is slow, and the database pauses when its monthly
free allowance runs out. A production rollout would move to a paid App
Service plan and database tier.

## Getting started

```bash
cp .env.example .env.local   # fill in GitHub and database settings
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without `GITHUB_TOKEN`
and `GITHUB_REPOSITORY`, requests are saved but no pipeline is started.
Without `AZURE_SQL_CONNECTION_STRING`, data goes to a local SQLite file.

### Deploying to Azure

Run once, in this order, against the PoC subscription:

```bash
scripts/azure-provision.sh         # App Service + Azure SQL
scripts/azure-github-identity.sh   # OIDC identity for GitHub Actions
scripts/azure-terraform-state.sh   # Terraform state storage
scripts/azure-auth.sh              # Entra ID sign-in (needs an app registration)
```

Then deploy the app with `scripts/azure-deploy.sh`.
