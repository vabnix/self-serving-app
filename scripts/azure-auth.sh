#!/usr/bin/env bash
# Turns on App Service built-in authentication ("Easy Auth") with Microsoft
# Entra ID, so everyone must sign in before reaching the portal. The app reads
# the signed-in user from the headers App Service adds to each request.
#
# Needs an app registration (single tenant) with the redirect URI
# https://<app>.azurewebsites.net/.auth/login/aad/callback, ID tokens enabled
# and a client secret. The script asks for the secret and stores it as an app
# setting; it is not echoed or saved anywhere else.
set -euo pipefail

CLIENT_ID="b98ae8dd-fb30-413d-ac2a-9b7088e4f462"
SUFFIX="$(az account show --query id -o tsv | cut -c1-6)"
TENANT_ID="$(az account show --query tenantId -o tsv)"
GROUP="rg-selfservice-poc"
APP="app-selfservice-poc-$SUFFIX"
SECRET_SETTING="MICROSOFT_PROVIDER_AUTHENTICATION_SECRET"

read -rsp "Client secret for app registration $CLIENT_ID: " SECRET
echo
[ -n "$SECRET" ] || { echo "No secret entered." >&2; exit 1; }

az webapp config appsettings set --resource-group "$GROUP" --name "$APP" \
  --settings "$SECRET_SETTING=$SECRET" --output none

APP_ID="$(az webapp show --resource-group "$GROUP" --name "$APP" --query id -o tsv)"

# The pipeline reports results to /api/requests/<id>/status and cannot sign
# in, so that path is left open. It checks its own per-request token.
az rest --method put \
  --url "https://management.azure.com$APP_ID/config/authsettingsV2?api-version=2022-03-01" \
  --body @- --output none <<JSON
{
  "properties": {
    "platform": { "enabled": true },
    "globalValidation": {
      "requireAuthentication": true,
      "unauthenticatedClientAction": "RedirectToLoginPage",
      "redirectToProvider": "azureactivedirectory",
      "excludedPaths": ["/api/requests/*"]
    },
    "identityProviders": {
      "azureActiveDirectory": {
        "enabled": true,
        "registration": {
          "clientId": "$CLIENT_ID",
          "clientSecretSettingName": "$SECRET_SETTING",
          "openIdIssuer": "https://login.microsoftonline.com/$TENANT_ID/v2.0"
        },
        "validation": {
          "allowedAudiences": ["api://$CLIENT_ID", "$CLIENT_ID"]
        }
      }
    },
    "login": {
      "tokenStore": { "enabled": true }
    },
    "httpSettings": {
      "requireHttps": true,
      "forwardProxy": { "convention": "NoProxy" }
    }
  }
}
JSON

echo "Sign-in enabled. https://$APP.azurewebsites.net"
