#!/usr/bin/env bash
# Gives the GitHub Actions provisioning workflow an Azure identity it signs in
# as through OIDC federation (no stored secret). Requesters name the resource
# group for each resource and the workflow creates it when it does not exist,
# so the identity is Contributor on the whole subscription.
set -euo pipefail

LOCATION="${LOCATION:-centralus}"
# GitHub's OIDC subject includes the numeric owner and repository IDs.
REPOSITORY="vabnix@19367260/self-serving-app@1418096279"
BRANCH="main"
GROUP="rg-selfservice-poc"
IDENTITY="id-selfservice-poc-github"

az identity create --resource-group "$GROUP" --name "$IDENTITY" \
  --location "$LOCATION" --output none
# Trust only workflow runs from this repository's main branch.
az identity federated-credential create --resource-group "$GROUP" \
  --identity-name "$IDENTITY" --name github-main \
  --issuer https://token.actions.githubusercontent.com \
  --subject "repo:$REPOSITORY:ref:refs/heads/$BRANCH" \
  --audiences api://AzureADTokenExchange --output none

PRINCIPAL_ID="$(az identity show --resource-group "$GROUP" --name "$IDENTITY" --query principalId -o tsv)"
SCOPE="/subscriptions/$(az account show --query id -o tsv)"
az role assignment create --assignee-object-id "$PRINCIPAL_ID" \
  --assignee-principal-type ServicePrincipal --role Contributor \
  --scope "$SCOPE" --output none

echo "AZURE_CLIENT_ID=$(az identity show --resource-group "$GROUP" --name "$IDENTITY" --query clientId -o tsv)"
echo "AZURE_TENANT_ID=$(az account show --query tenantId -o tsv)"
echo "AZURE_SUBSCRIPTION_ID=$(az account show --query id -o tsv)"
