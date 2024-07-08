output "azurerm_linux_web_app_url" {
  value = "https://${azurerm_linux_web_app.l_w_a.default_hostname}"
}

output "custom_hostname" {
  value = "https://${azurerm_app_service_custom_hostname_binding.a_s_c_h_b.hostname}"
}