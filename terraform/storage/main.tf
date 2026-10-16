locals {
  containers = toset([
    for container in split(",", var.containers) : trimspace(container)
    if trimspace(container) != ""
  ])

  tags = merge(
    {
      owner             = var.team
      technical_contact = var.technical_contact
      environment       = var.environment
      workload          = var.name
      request_id        = var.request_id
      managed_by        = "self-service-portal"
    },
    var.requester == null ? {} : { requester = var.requester },
    var.expires_on == null ? {} : { expires_on = var.expires_on },
  )
}

data "azurerm_resource_group" "target" {
  name = var.resource_group
}

resource "azurerm_storage_account" "this" {
  name                = var.resource_names.storage_account
  resource_group_name = data.azurerm_resource_group.target.name
  # Requests made before the region question have no location and keep the
  # resource group's region.
  location = coalesce(var.location, data.azurerm_resource_group.target.location)

  account_kind             = "StorageV2"
  account_tier             = "Standard"
  account_replication_type = var.replication
  access_tier              = var.access_tier
  is_hns_enabled           = var.enable_data_lake

  # Security defaults every storage account gets.
  min_tls_version                 = "TLS1_2"
  https_traffic_only_enabled      = true
  allow_nested_items_to_be_public = false

  blob_properties {
    versioning_enabled = var.enable_versioning
  }

  tags = local.tags

  lifecycle {
    precondition {
      condition     = !(var.enable_data_lake && var.enable_versioning)
      error_message = "Blob versioning cannot be enabled together with Data Lake (hierarchical namespace)."
    }
  }
}

resource "azurerm_storage_container" "this" {
  for_each = local.containers

  name                  = each.value
  storage_account_id    = azurerm_storage_account.this.id
  container_access_type = "private"
}
