# ( Based on https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs#example-usage : )
# We strongly recommend using the required_providers block to set the
# Azure Provider source and version being used
terraform {
  required_providers {
    linode = {
      source  = "linode/linode"
      version = "1.16.0"
    }

    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=3.106.1"
    }
  }
}



# Configure the Linode Provider.
provider "linode" {
  token = var.linode_personal_access_token
}

# Configure the Microsoft Azure Provider
provider "azurerm" {
  skip_provider_registration = true # This is only required when the User, Service Principal, or Identity running Terraform lacks the permissions to register Azure Resource Providers.
  features {}
}



resource "azurerm_resource_group" "rg_m_p_f_a_c_a_3" {
  name     = "rg-m-p-f-a-c-a-3"
  location = "West Europe"
}

resource "azurerm_service_plan" "s_p" {
  name                = "s-p"
  resource_group_name = azurerm_resource_group.rg_m_p_f_a_c_a_3.name
  location            = azurerm_resource_group.rg_m_p_f_a_c_a_3.location
  os_type             = "Linux"
  # sku_name            = "P1v2"
  # (
  # According to the resource at
  # https://learn.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-custom-domain?tabs=root%2Cazurecli :
  # [To be able to] map an existing custom DNS name to an Azure App Service,
  # ... the web app's App Service plan must be a paid tier and not Free (F1).
  # )
  # sku_name            = "F1"
  sku_name            = "B1"
}

resource "azurerm_linux_web_app" "l_w_a" {
  name                = "l-w-a"
  resource_group_name = azurerm_resource_group.rg_m_p_f_a_c_a_3.name
  location            = azurerm_resource_group.rg_m_p_f_a_c_a_3.location
  service_plan_id     = azurerm_service_plan.s_p.id

  site_config {
    # ( Based on https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/linux_web_app#site_config : )
    # `always_on` must be explicitly set to false when using `Free`, `F1`, `D1`, or `Shared` Service Plans.
    always_on = false

    application_stack {
      docker_image_name        = "${var.docker_io_username}/${var.name_of_container_image}:${var.tag_for_container_image}"
      docker_registry_url      = "https://docker.io"
      # docker_registry_username = var.docker_io_username
      # docker_registry_password = var.docker_io_access_token
    }
  }

  # Despite what the following resources state/claim,
  # commenting out the next block
  # does _not_ hinder the Azure App Service
  # from understanding/guessing what port the (above-specified) container is listening on!
  #
  # https://duckduckgo.com/?q=how+to+tell+azurerm_linux_web_app+what+port+the+deployed+container+is+listening+on&atb=v413-1&ia=web
  #
  #   https://learn.microsoft.com/en-us/azure/app-service/reference-app-settings?tabs=kudu%2Cdotnet
  #     `WEBSITES_PORT`
  #     For a custom container, the custom port number on the container for App Service to route requests to.
  #     By default, App Service attempts automatic port detection of ports 80 and 8080.
  #     This setting isn't injected into the container as an environment variable.
  #
  #   https://stackoverflow.com/questions/72705694/specify-port-while-deploying-a-docker-container-for-terraform-provider-for-azure
  #
  #     https://github.com/hashicorp/terraform-provider-azurerm/blob/main/examples/app-service/docker-basic/main.tf
  app_settings = {
    # For details, you can consult
    # https://learn.microsoft.com/en-us/azure/app-service/reference-app-settings?tabs=kudu%2Cdotnet#custom-containers
    "WEBSITES_PORT" = "5000"
  }
}



resource "linode_domain_record" "l_d_r_1_txt" {
  domain_id   = var.linode_id_of_custom_domain

  record_type = "TXT"
  name        = "asuid.${var.custom_subdomain}"
  target      = azurerm_linux_web_app.l_w_a.custom_domain_verification_id
}

resource "linode_domain_record" "l_d_r_2_cname" {
  domain_id   = var.linode_id_of_custom_domain

  record_type = "CNAME"
  name        = var.custom_subdomain
  target      = azurerm_linux_web_app.l_w_a.default_hostname
}

resource "azurerm_app_service_custom_hostname_binding" "a_s_c_h_b" {
  hostname            = "${var.custom_subdomain}.${var.custom_domain}"
  app_service_name    = azurerm_linux_web_app.l_w_a.name
  resource_group_name = azurerm_resource_group.rg_m_p_f_a_c_a_3.name

  # Ignore ssl_state and thumbprint as they are managed using
  # azurerm_app_service_certificate_binding.example
  lifecycle {
    ignore_changes = [ssl_state, thumbprint]
  }
}

resource "azurerm_app_service_managed_certificate" "a_s_m_c" {
  custom_hostname_binding_id = azurerm_app_service_custom_hostname_binding.a_s_c_h_b.id
}

resource "azurerm_app_service_certificate_binding" "a_s_c_b" {
  hostname_binding_id = azurerm_app_service_custom_hostname_binding.a_s_c_h_b.id
  certificate_id      = azurerm_app_service_managed_certificate.a_s_m_c.id
  ssl_state           = "SniEnabled"
}
