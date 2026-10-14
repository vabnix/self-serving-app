#!/usr/bin/env bash
# Creates the Azure resources for the PoC in one resource group: a free-tier
# App Service and an Azure SQL database on the free offer. Run once, against
# the subscription currently selected in the Azure CLI. Delete everything with:
#   az group delete --name rg-selfservice-poc
set -euo pipefail

# Central US: the free App Service tier had no quota in East US / East US 2.
LOCATION="${LOCATION:-centralus}"
SUFFIX="$(az account show --query id -o tsv | cut -c1-6)"
GROUP="rg-selfservice-poc"
PLAN="asp-selfservice-poc"
APP="app-selfservice-poc-$SUFFIX"
SQL_SERVER="sql-selfservice-poc-$SUFFIX"
SQL_DB="sqldb-portal"
SQL_ADMIN="portaladmin"
# Generated here and stored only in the web app's settings.
SQL_PASSWORD="$(openssl rand -base64 30 | tr -d '/+=' | cut -c1-28)aA1"

az group show --name "$GROUP" --output none 2>/dev/null ||
  az group create --name "$GROUP" --location "$LOCATION" --output none

az appservice plan create --resource-group "$GROUP" --name "$PLAN" \
  --location "$LOCATION" --is-linux --sku F1 --output none
az webapp create --resource-group "$GROUP" --plan "$PLAN" --name "$APP" \
  --runtime "NODE:24-lts" --https-only true --output none

az sql server create --resource-group "$GROUP" --name "$SQL_SERVER" \
  --location "$LOCATION" --admin-user "$SQL_ADMIN" \
  --admin-password "$SQL_PASSWORD" --output none
# Lets Azure-hosted services, including the web app, reach the server.
az sql server firewall-rule create --resource-group "$GROUP" \
  --server "$SQL_SERVER" --name AllowAzureServices \
  --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0 --output none
# Free offer: pauses instead of billing once the monthly allowance is used.
az sql db create --resource-group "$GROUP" --server "$SQL_SERVER" \
  --name "$SQL_DB" --edition GeneralPurpose --family Gen5 --capacity 2 \
  --compute-model Serverless --auto-pause-delay 60 \
  --use-free-limit true --free-limit-exhaustion-behavior AutoPause \
  --backup-storage-redundancy Local --output none

az webapp config appsettings set --resource-group "$GROUP" --name "$APP" \
  --output none --settings \
  "AZURE_SQL_CONNECTION_STRING=Server=tcp:$SQL_SERVER.database.windows.net,1433;Database=$SQL_DB;User Id=$SQL_ADMIN;Password=$SQL_PASSWORD;Encrypt=true;Connection Timeout=60" \
  SCM_DO_BUILD_DURING_DEPLOYMENT=false
az webapp config set --resource-group "$GROUP" --name "$APP" \
  --startup-file "HOSTNAME=0.0.0.0 node server.js" --output none

echo "Created. Web app: https://$APP.azurewebsites.net"
