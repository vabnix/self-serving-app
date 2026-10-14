#!/usr/bin/env bash
# Gives the GitHub Actions provisioning workflow an Azure identity it signs in
# as through OIDC federation (no stored secret). The identity can only manage
# the resource group that holds resources created through the portal.
set -euo pipefail

LOCATION="${LOCATION:-centralus}"
REPOSITORY="vabnix/self-serving-app"
BRANCH="main"
GROUP="rg-selfservice-poc"
IDENTITY="id-selfservice-poc-github"
# Everything the portal provisions lands here.
RESOURCES_GROUP="rg-selfservice-poc-resources"

az group create --name "$RESOURCES_GROUP" --location "$LOCATION" --output none

az identity create --resource-group "$GROUP" --name "$IDENTITY" \
  --location "$LOCATION" --output none
# Trust only workflow runs from this repository's main branch.
az identity federated-credential create --resource-group "$GROUP" \
  --identity-name "$IDENTITY" --name github-main \
  --issuer https://token.actions.githubusercontent.com \
  --subject "repo:$REPOSITORY:ref:refs/heads/$BRANCH" \
  --audiences api://AzureADTokenExchange --output none

PRINCIPAL_ID="$(az identity show --resource-group "$GROUP" --name "$IDENTITY" --query principalId -o tsv)"
SCOPE="$(az group show --name "$RESOURCES_GROUP" --query id -o tsv)"
az role assignment create --assignee-object-id "$PRINCIPAL_ID" \
  --assignee-principal-type ServicePrincipal --role Contributor \
  --scope "$SCOPE" --output none

echo "AZURE_CLIENT_ID=$(az identity show --resource-group "$GROUP" --name "$IDENTITY" --query clientId -o tsv)"
echo "AZURE_TENANT_ID=$(az account show --query tenantId -o tsv)"
echo "AZURE_SUBSCRIPTION_ID=$(az account show --query id -o tsv)"
