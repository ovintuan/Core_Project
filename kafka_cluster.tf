resource "docker_container" "kafka_1" {
  name     = "kafka-1"
  image    = var.kafka_image
  hostname = "kafka-1"
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  env = [
    "KAFKA_CFG_NODE_ID=1",
    "KAFKA_CFG_PROCESS_ROLES=broker,controller",
    "KAFKA_CFG_LISTENERS=PLAINTEXT://:${var.kafka_port},CONTROLLER://:${var.kafka_controller_port}",
    "KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka-1:${var.kafka_port}",
    "KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER",
    "KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@kafka-1:${var.kafka_controller_port},2@kafka-2:${var.kafka_controller_port},3@kafka-3:${var.kafka_controller_port}",
    "KAFKA_CFG_OFFSETS_TOPIC_REPLICATION_FACTOR=3",
    "KAFKA_CFG_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=3",
    "KAFKA_CFG_TRANSACTION_STATE_LOG_MIN_ISR=2",
    # "KAFKA_CFG_LOG_DIRS=/opt/bitnami/kafka/data",
    "ALLOW_PLAINTEXT_LISTENER=yes",
    "KAFKA_KRAFT_CLUSTER_ID=abcdefghijklmnopqrstuv"
  ]
  ports {
    internal = var.kafka_port
  }
  mounts {
    target = "/bitnami/kafka/data"
    type   = "bind"
    source = abspath("./local_data_storage/kafka/1")
  }
  restart = "on-failure"
}

resource "docker_container" "kafka_2" {
  name     = "kafka-2"
  image    = var.kafka_image
  hostname = "kafka-2"
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  env = [
    "KAFKA_CFG_NODE_ID=2",
    "KAFKA_CFG_PROCESS_ROLES=broker,controller",
    "KAFKA_CFG_LISTENERS=PLAINTEXT://:${var.kafka_port},CONTROLLER://:${var.kafka_controller_port}",
    "KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka-2:${var.kafka_port}",
    "KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER",
    "KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@kafka-1:${var.kafka_controller_port},2@kafka-2:${var.kafka_controller_port},3@kafka-3:${var.kafka_controller_port}",
    "KAFKA_CFG_OFFSETS_TOPIC_REPLICATION_FACTOR=3",
    "KAFKA_CFG_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=3",
    "KAFKA_CFG_TRANSACTION_STATE_LOG_MIN_ISR=2",
    # "KAFKA_CFG_LOG_DIRS=/opt/bitnami/kafka/data",
    "ALLOW_PLAINTEXT_LISTENER=yes",
    "KAFKA_KRAFT_CLUSTER_ID=abcdefghijklmnopqrstuv"
  ]
  ports {
    internal = var.kafka_port
  }
  mounts {
    target = "/bitnami/kafka/data"
    type   = "bind"
    source = abspath("./local_data_storage/kafka/2")
  }
  restart = "on-failure"
}

resource "docker_container" "kafka_3" {
  name     = "kafka-3"
  image    = var.kafka_image
  hostname = "kafka-3"
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  env = [
    "KAFKA_CFG_NODE_ID=3",
    "KAFKA_CFG_PROCESS_ROLES=broker,controller",
    "KAFKA_CFG_LISTENERS=PLAINTEXT://:${var.kafka_port},CONTROLLER://:${var.kafka_controller_port}",
    "KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka-3:${var.kafka_port}",
    "KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER",
    "KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@kafka-1:${var.kafka_controller_port},2@kafka-2:${var.kafka_controller_port},3@kafka-3:${var.kafka_controller_port}",
    "KAFKA_CFG_OFFSETS_TOPIC_REPLICATION_FACTOR=3",
    "KAFKA_CFG_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=3",
    "KAFKA_CFG_TRANSACTION_STATE_LOG_MIN_ISR=2",
    # "KAFKA_CFG_LOG_DIRS=/opt/bitnami/kafka/data",
    "ALLOW_PLAINTEXT_LISTENER=yes",
    "KAFKA_KRAFT_CLUSTER_ID=abcdefghijklmnopqrstuv"
  ]
  ports {
    internal = var.kafka_port
  }
  mounts {
    target = "/bitnami/kafka/data"
    type   = "bind"
    source = abspath("./local_data_storage/kafka/3")
  }
  restart = "on-failure"
}

resource "docker_container" "kafka_schema_registry" {
  name            = "kafka_schema_registry"
  image           = var.kafka_schema_registry_image
  hostname        = var.kafka_schema_registry_hostname
  restart         = "on-failure"
  max_retry_count = 5
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  env = [
    "SCHEMA_REGISTRY_DEBUG=true",
    "SCHEMA_REGISTRY_KAFKA_BROKERS=PLAINTEXT://${local.kafka_bootstrap_servers}",
    "ALLOW_PLAINTEXT_LISTENER=yes",
    "SCHEMA_REGISTRY_HOST_NAME=${var.kafka_schema_registry_hostname}",
    "SCHEMA_REGISTRY_LISTENERS=http://${var.kafka_schema_registry_hostname}:${var.kafka_schema_registry_port}"
  ]
  ports {
    internal = var.kafka_schema_registry_port
    external = var.kafka_schema_registry_port
  }
  depends_on = [docker_container.kafka_1, docker_container.kafka_2, docker_container.kafka_3]
}

resource "docker_container" "kafka_ui" {
  name  = "kafka-ui"
  image = var.kafka_ui_image
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  env = [
    "KAFKA_CLUSTERS_0_NAME=Kafka Cluster Sample",
    "DYNAMIC_CONFIG_ENABLED=true",
    "KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS=${local.kafka_bootstrap_servers}",
    "KAFKA_CLUSTERS_0_SCHEMAREGISTRY=http://${var.kafka_schema_registry_hostname}:${var.kafka_schema_registry_port}"
  ]
  ports {
    internal = var.kafka_ui_port_internal
    external = var.kafka_ui_port_external
  }
  depends_on = [docker_container.kafka_1, docker_container.kafka_2, docker_container.kafka_3, docker_container.kafka_schema_registry]
  restart = "on-failure"
}


