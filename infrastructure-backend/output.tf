output "azurerm_mysql_flexible_server_fully_qualified_domain_name" {
  value = azurerm_mysql_flexible_server.m_f_s.fqdn
}

output "azurerm_linux_web_app_default_hostname" {
  value = azurerm_linux_web_app.l_w_a.default_hostname
}

output "custom_hostname" {
  value = "https://${azurerm_app_service_custom_hostname_binding.a_s_c_h_b.hostname}"
}
