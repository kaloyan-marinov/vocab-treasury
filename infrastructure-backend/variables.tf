variable "mysql_server_administrator_login"{
  description = "username for an admin in the to-be-provisioned MySQL server"
  type        = string
  sensitive   = true
}

variable "mysql_server_administrator_password" {
  description = "password for an admin in the to-be-provisioned MySQL server"
  type        = string
  sensitive   = true
}

variable "name_4_mysql_server_database" {
  description = "name for a to-be-created database in the to-be-provisioned MySQL server"
  type        = string
  sensitive   = true
}
