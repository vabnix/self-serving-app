#!/usr/bin/env bash
# Builds the portal locally and deploys it to the PoC App Service created by
# scripts/azure-provision.sh.
set -euo pipefail
cd "$(dirname "$0")/.."

SUFFIX="$(az account show --query id -o tsv | cut -c1-6)"
GROUP="rg-selfservice-poc"
APP="app-selfservice-poc-$SUFFIX"

BUILD_STANDALONE=1 npm run build
cp -R .next/static .next/standalone/.next/static
cp -R public .next/standalone/public

PACKAGE="$(mktemp -d)/portal.zip"
(cd .next/standalone && zip -qr "$PACKAGE" .)
az webapp deploy --resource-group "$GROUP" --name "$APP" \
  --src-path "$PACKAGE" --type zip --output none

echo "Deployed. https://$APP.azurewebsites.net"
