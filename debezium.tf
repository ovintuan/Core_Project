resource "docker_volume" "debezium" {
  name = var.volume_debezium
}

resource "docker_container" "debezium" {
  name  = "debezium"
  image = var.debezium_image
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  env = [
    "BOOTSTRAP_SERVERS=${local.kafka_bootstrap_servers}",
    "GROUP_ID=${var.debezium_group_id}",
    "CONFIG_STORAGE_TOPIC=${var.debezium_config_storage_topic}",
    "OFFSET_STORAGE_TOPIC=${var.debezium_offset_storage_topic}",
    "STATUS_STORAGE_TOPIC=${var.debezium_status_storage_topic}"
  ]
  ports {
    internal = var.debezium_port_internal
    external = var.debezium_port_external
  }
  volumes {
    container_path = "/mnt/debezium-history"
    volume_name    = docker_volume.debezium.name
  }
  depends_on = [docker_container.kafka_ui, docker_container.sqlserver_database_1]
}


