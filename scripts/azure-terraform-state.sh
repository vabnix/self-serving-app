#!/usr/bin/env bash
# Creates the storage that holds Terraform state for resources provisioned
# through the portal (one state file per request), and lets the GitHub
# workflow identity read and write it.
set -euo pipefail

LOCATION="${LOCATION:-centralus}"
SUFFIX="$(az account show --query id -o tsv | cut -c1-6)"
GROUP="rg-selfservice-poc"
IDENTITY="id-selfservice-poc-github"
STATE_ACCOUNT="stselfservicepoc$SUFFIX"
STATE_CONTAINER="tfstate"

az storage account create --resource-group "$GROUP" --name "$STATE_ACCOUNT" \
  --location "$LOCATION" --sku Standard_LRS --kind StorageV2 \
  --min-tls-version TLS1_2 --allow-blob-public-access false --output none
az storage container create --account-name "$STATE_ACCOUNT" \
  --name "$STATE_CONTAINER" --auth-mode login --output none 2>/dev/null ||
  az storage container-rm create --resource-group "$GROUP" \
    --storage-account "$STATE_ACCOUNT" --name "$STATE_CONTAINER" --output none

PRINCIPAL_ID="$(az identity show --resource-group "$GROUP" --name "$IDENTITY" --query principalId -o tsv)"
SCOPE="$(az storage account show --resource-group "$GROUP" --name "$STATE_ACCOUNT" --query id -o tsv)"
az role assignment create --assignee-object-id "$PRINCIPAL_ID" \
  --assignee-principal-type ServicePrincipal \
  --role "Storage Blob Data Contributor" --scope "$SCOPE" --output none

echo "State storage: $STATE_ACCOUNT / $STATE_CONTAINER"
