terraform {
  required_version = ">= 1.5"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  # Configured by the provisioning workflow: one state file per request.
  backend "azurerm" {}
}

provider "azurerm" {
  features {}

  # The workflow identity can only manage one resource group, so it cannot
  # register resource providers on the subscription.
  resource_provider_registrations = "none"
}
