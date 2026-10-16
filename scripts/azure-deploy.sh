#!/usr/bin/env bash
# Builds the portal locally and deploys it to the PoC App Service created by
# scripts/azure-provision.sh.
set -euo pipefail
cd "$(dirname "$0")/.."

# Deploy only committed code, so the live site always matches a commit.
# Untracked files are not built, so only tracked changes block a deploy.
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "Uncommitted changes. Commit or stash them before deploying." >&2
  exit 1
fi
COMMIT="$(git rev-parse --short HEAD)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" && "${ALLOW_BRANCH_DEPLOY:-}" != "1" ]]; then
  echo "On branch $BRANCH. Deploy from main, or set ALLOW_BRANCH_DEPLOY=1." >&2
  exit 1
fi

SUFFIX="$(az account show --query id -o tsv | cut -c1-6)"
GROUP="rg-selfservice-poc"
APP="app-selfservice-poc-$SUFFIX"

BUILD_STANDALONE=1 npm run build
cp -R .next/static .next/standalone/.next/static
cp -R public .next/standalone/public

PACKAGE="$(mktemp -d)/portal.zip"
(cd .next/standalone && zip -qr "$PACKAGE" .)
az webapp deploy --resource-group "$GROUP" --name "$APP" \
  --src-path "$PACKAGE" --type zip --clean true --output none
# Recorded only once the deploy succeeds; `az webapp config appsettings list`
# shows it.
az webapp config appsettings set --resource-group "$GROUP" --name "$APP" \
  --settings DEPLOYED_COMMIT="$COMMIT" --output none
# --clean removes the previous build, including the page cache Next.js writes
# to disk at runtime; the restart drops what the running server holds in
# memory. Without both, the site keeps serving pages from the old build.
az webapp restart --resource-group "$GROUP" --name "$APP"

echo "Deployed $COMMIT. https://$APP.azurewebsites.net"
