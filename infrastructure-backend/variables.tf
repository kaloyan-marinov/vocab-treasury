variable "linode_personal_access_token" {
  description = "personal access token for Linode account"
  type        = string
  sensitive   = true
}

variable "secret_key_for_backend_application" {
  description = "secret key for the backend application"
  type        = string
  sensitive   = true
}



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



variable "docker_io_username" {
  description = "username for docker.io account"
  type        = string
  sensitive   = true
}

# variable "docker_io_access_token" {
#   description = "access token for docker.io account"
#   type        = string
#   sensitive   = true
# }

variable "name_of_container_image" {
  description = "name of container image"
  type        = string
}

variable "tag_for_container_image" {
  description = "tag for container image"
  type        = string
}



variable "mail_server_url" {
  description = "domain/URL for a mail server"
  type        = string
  sensitive   = true
}

variable "mail_server_port" {
  description = "port for the mail server"
  type        = string
  sensitive   = true
}

variable "mail_server_username" {
  description = "username for the mail server"
  type        = string
  sensitive   = true
}

variable "mail_server_password" {
  description = "password for the mail server"
  type        = string
  sensitive   = true
}



variable "mail_server_email_address_of_administrator_for_sending" {
  description = "email address, which will be listed as the sender whenever the mail server is used to send an email"
  type        = string
  sensitive   = true
}

variable "mail_server_email_address_of_administrator_for_receiving" {
  description = "(?) email address that you have access to (?)"
  type        = string
  sensitive   = true
}



variable "days_for_email_address_confirmation" {
  description = "number of days, within which a newly-created user has to confirm his/her email address"
  type        = string
  sensitive   = true
}

variable "minutes_for_token_validity" {
  description = "number of minutes, which each access token issued by the backend will be valid for"
  type        = string
  sensitive   = true
}

variable "minutes_for_password_reset" {
  description = "number of minutes, which a password-reset token/link issued by the backend will be valid for"
  type        = string
  sensitive   = true
}



variable "custom_domain" {
  description = "a domain that you own and that is managed via the Domains section of your Linode account"
  type        = string
}

variable "linode_id_of_custom_domain" {
  description = "Go to the Domains section of your Linode account, find out the ID of the domain, and provide that ID here."
  type        = string
}

variable "custom_subdomain" {
  description = "custom subdomain of `custom_domain`, which the containerized backend application is to be made available at"
  type        = string
}
