output "storage_account_name" {
  value = azurerm_storage_account.this.name
}

output "storage_account_id" {
  value = azurerm_storage_account.this.id
}

output "primary_blob_endpoint" {
  value = azurerm_storage_account.this.primary_blob_endpoint
}

output "resource_group" {
  value = azurerm_storage_account.this.resource_group_name
}

output "location" {
  value = azurerm_storage_account.this.location
}

output "containers" {
  value = sort([for container in azurerm_storage_container.this : container.name])
}

output "tags" {
  value = azurerm_storage_account.this.tags
}
