variable "linode_personal_access_token"{
  description = "personal access token for Linode account"  
  type        = string
  sensitive   = true
}

variable "docker_io_username" {
  description = "username for docker.io account"
  type        = string
  sensitive   = true
}

variable "docker_io_access_token" {
  description = "access token for docker.io account"
  type        = string
  sensitive   = true
}

variable "name_of_container_image" {
  description = "name of container image"
  type        = string
}

variable "tag_for_container_image" {
  description = "tag for container image"
  type        = string
}

variable "custom_domain" {
  description = "a domain that you own and that is managed via the Domains section of your Linode account"
  type        = string
}

variable "linode_id_of_custom_domain" {
  description = "Go to the Domains section of your Linode account, find out the ID of the domain, and provide that ID here."
  type        = number
}

variable "custom_subdomain" {
  description = "custom subdomain of `custom_domain`, which the containerized web application is to be made available at"
  type        = string
}
