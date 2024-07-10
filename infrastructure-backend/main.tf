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
      version = "=3.111.0"
    }
  }
}



# # Configure the Linode Provider.
# provider "linode" {
#   token = var.linode_personal_access_token
# }

# Configure the Microsoft Azure Provider
provider "azurerm" {
  skip_provider_registration = true # This is only required when the User, Service Principal, or Identity running Terraform lacks the permissions to register Azure Resource Providers.
  features {}
}



resource "azurerm_resource_group" "rg_vocab_treasury_backend" {
  name     = "rg-vocab-treasury-backend"
  location = "West Europe"
}

resource "azurerm_virtual_network" "v_n" {
  name                = "v-n"
  resource_group_name = azurerm_resource_group.rg_vocab_treasury_backend.name
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.rg_vocab_treasury_backend.location
}

resource "azurerm_subnet" "s" {
  name                 = "s"
  resource_group_name  = azurerm_resource_group.rg_vocab_treasury_backend.name
  virtual_network_name = azurerm_virtual_network.v_n.name
  address_prefixes     = ["10.0.2.0/24"]

  delegation {
    name = "fs"

    service_delegation {
      name = "Microsoft.DBforMySQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

resource "azurerm_mysql_flexible_server" "m_f_s" {
  name                = "m-f-s"
  resource_group_name = azurerm_resource_group.rg_vocab_treasury_backend.name
  location            = azurerm_resource_group.rg_vocab_treasury_backend.location
  version             = "8.0.21"

  administrator_login    = var.mysql_server_administrator_login
  administrator_password = var.mysql_server_administrator_password

  storage {
    size_gb = 20
  }

  backup_retention_days  = 7
  sku_name               = "GP_Standard_D2ds_v4"

  delegated_subnet_id = azurerm_subnet.s.id

  tags = {
    environment = "production"
  }

  # zone = "3"
  zone = "3"
}

resource "azurerm_mysql_flexible_server_firewall_rule" "f_s_f_r" {
  name                = "f-s-f_r"
  resource_group_name = azurerm_resource_group.rg_vocab_treasury_backend.name
  server_name         = azurerm_mysql_flexible_server.m_f_s.name
  start_ip_address    = "0.0.0.0"
  end_ip_address      = "0.0.0.0"
}

resource "azurerm_mysql_flexible_database" "m_f_s_d" {
  # name                = "m-f-s-d"
  name                = var.name_4_mysql_server_database
  resource_group_name = azurerm_resource_group.rg_vocab_treasury_backend.name
  server_name         = azurerm_mysql_flexible_server.m_f_s.name
  # charset             = "utf-8"
  # collation           = "uft8_unicode_ci"
  charset             = "utf8mb4"
  collation           = "utf8mb4_unicode_ci"
}

# resource "azurerm_service_plan" "s_p" {
#   name                = "s-p"
#   resource_group_name = azurerm_resource_group.rg_vocab_treasury_backend.name
#   location            = azurerm_resource_group.rg_vocab_treasury_backend.location
#   os_type             = "Linux"
#   # sku_name            = "P1v2"
#   # (
#   # According to the resource at
#   # https://learn.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-custom-domain?tabs=root%2Cazurecli :
#   # [To be able to] map an existing custom DNS name to an Azure App Service,
#   # ... the web app's App Service plan must be a paid tier and not Free (F1).
#   # )
#   # sku_name            = "F1"
#   sku_name            = "B1"
# }

# resource "azurerm_linux_web_app" "l_w_a" {
#   name                = "l-w-a"
#   resource_group_name = azurerm_resource_group.rg_vocab_treasury_backend.name
#   location            = azurerm_resource_group.rg_vocab_treasury_backend.location
#   service_plan_id     = azurerm_service_plan.s_p.id

#   site_config {
#     # ( Based on https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/linux_web_app#site_config : )
#     # `always_on` must be explicitly set to false when using `Free`, `F1`, `D1`, or `Shared` Service Plans.
#     always_on = false

#     application_stack {
#       docker_image_name        = "${var.docker_io_username}/${var.name_of_container_image}:${var.tag_for_container_image}"
#       docker_registry_url      = "https://docker.io"
#       # docker_registry_username = var.docker_io_username
#       # docker_registry_password = var.docker_io_access_token
#     }
#   }

#   # Despite what the following resources state/claim,
#   # commenting out the next block
#   # does _not_ hinder the Azure App Service
#   # from understanding/guessing what port the (above-specified) container is listening on!
#   #
#   # https://duckduckgo.com/?q=how+to+tell+azurerm_linux_web_app+what+port+the+deployed+container+is+listening+on&atb=v413-1&ia=web
#   #
#   #   https://learn.microsoft.com/en-us/azure/app-service/reference-app-settings?tabs=kudu%2Cdotnet
#   #     `WEBSITES_PORT`
#   #     For a custom container, the custom port number on the container for App Service to route requests to.
#   #     By default, App Service attempts automatic port detection of ports 80 and 8080.
#   #     This setting isn't injected into the container as an environment variable.
#   #
#   #   https://stackoverflow.com/questions/72705694/specify-port-while-deploying-a-docker-container-for-terraform-provider-for-azure
#   #
#   #     https://github.com/hashicorp/terraform-provider-azurerm/blob/main/examples/app-service/docker-basic/main.tf
#   app_settings = {
#     # For details, you can consult
#     # https://learn.microsoft.com/en-us/azure/app-service/reference-app-settings?tabs=kudu%2Cdotnet#custom-containers
#     "WEBSITES_PORT" = "5000"
#   }
# }



# resource "linode_domain_record" "l_d_r_1_txt" {
#   domain_id   = var.linode_id_of_custom_domain

#   record_type = "TXT"
#   name        = "asuid.${var.custom_subdomain}"
#   target      = azurerm_linux_web_app.l_w_a.custom_domain_verification_id
# }

# resource "linode_domain_record" "l_d_r_2_cname" {
#   domain_id   = var.linode_id_of_custom_domain

#   record_type = "CNAME"
#   name        = var.custom_subdomain
#   target      = azurerm_linux_web_app.l_w_a.default_hostname
# }

# resource "azurerm_app_service_custom_hostname_binding" "a_s_c_h_b" {
#   hostname            = "${var.custom_subdomain}.${var.custom_domain}"
#   app_service_name    = azurerm_linux_web_app.l_w_a.name
#   resource_group_name = azurerm_resource_group.rg_vocab_treasury_backend.name

#   # Ignore ssl_state and thumbprint as they are managed using
#   # azurerm_app_service_certificate_binding.example
#   lifecycle {
#     ignore_changes = [ssl_state, thumbprint]
#   }
# }

# resource "azurerm_app_service_managed_certificate" "a_s_m_c" {
#   custom_hostname_binding_id = azurerm_app_service_custom_hostname_binding.a_s_c_h_b.id
# }

# resource "azurerm_app_service_certificate_binding" "a_s_c_b" {
#   hostname_binding_id = azurerm_app_service_custom_hostname_binding.a_s_c_h_b.id
#   certificate_id      = azurerm_app_service_managed_certificate.a_s_m_c.id
#   ssl_state           = "SniEnabled"
# }
