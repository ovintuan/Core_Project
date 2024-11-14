


resource "docker_container" "kafka_1" {
    name  = "kafka-1"
    image = "bitnami/kafka:3.8.1"
    hostname = "kafka-1"
    networks_advanced {
        name = docker_network.pyspark_workspace_network.name
    }
    env = [
        "KAFKA_CFG_NODE_ID=1",
        "KAFKA_CFG_PROCESS_ROLES=broker,controller",
        "KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093",
        "KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka-1:9092",
        "KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER",
        "KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@kafka-1:9093,2@kafka-2:9093,3@kafka-3:9093",
        "KAFKA_CFG_OFFSETS_TOPIC_REPLICATION_FACTOR=3",
        "KAFKA_CFG_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=3",
        "KAFKA_CFG_TRANSACTION_STATE_LOG_MIN_ISR=2",
        "KAFKA_CFG_LOG_DIRS=/opt/bitnami/kafka/data",
        "ALLOW_PLAINTEXT_LISTENER=yes",
        "KAFKA_KRAFT_CLUSTER_ID=abcdefghijklmnopqrstuv"
    ]
    ports {
        internal = 9092
    }
    mounts {
      target = "/bitnami/kafka"
      type = "bind"
      source = abspath("./local_data_storage/kafka/1")
    }
}


resource "docker_container" "kafka_2" {
    name  = "kafka-2"
    image = "bitnami/kafka:3.8.1"
    hostname =  "kafka-2"
    networks_advanced {
        name = docker_network.pyspark_workspace_network.name
    }
    env = [
        "KAFKA_CFG_NODE_ID=2",
        "KAFKA_CFG_PROCESS_ROLES=broker,controller",
        "KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093",
        "KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka-2:9092",
        "KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER",
        "KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@kafka-1:9093,2@kafka-2:9093,3@kafka-3:9093",
        "KAFKA_CFG_OFFSETS_TOPIC_REPLICATION_FACTOR=3",
        "KAFKA_CFG_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=3",
        "KAFKA_CFG_TRANSACTION_STATE_LOG_MIN_ISR=2",
        "KAFKA_CFG_LOG_DIRS=/opt/bitnami/kafka/data",
        "ALLOW_PLAINTEXT_LISTENER=yes",
        "KAFKA_KRAFT_CLUSTER_ID=abcdefghijklmnopqrstuv"
    ]
    ports {
        internal = 9092
    }
    mounts {
      target = "/bitnami/kafka"
      type = "bind"
      source = abspath("./local_data_storage/kafka/2")
    }
}

resource "docker_container" "kafka_3" {
    name  = "kafka-3"
    image = "bitnami/kafka:3.8.1"
    hostname = "kafka-3"
    networks_advanced {
        name = docker_network.pyspark_workspace_network.name
    }
    env = [
        "KAFKA_CFG_NODE_ID=3",
        "KAFKA_CFG_PROCESS_ROLES=broker,controller",
        "KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093",
        "KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka-3:9092",
        "KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER",
        "KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=1@kafka-1:9093,2@kafka-2:9093,3@kafka-3:9093",
        "KAFKA_CFG_OFFSETS_TOPIC_REPLICATION_FACTOR=3",
        "KAFKA_CFG_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=3",
        "KAFKA_CFG_TRANSACTION_STATE_LOG_MIN_ISR=2",
        "KAFKA_CFG_LOG_DIRS=/opt/bitnami/kafka/data",
        "ALLOW_PLAINTEXT_LISTENER=yes",
        "KAFKA_KRAFT_CLUSTER_ID=abcdefghijklmnopqrstuv"
    ]
    ports {
        internal = 9092
    }
    mounts {
      target = "/bitnami/kafka"
      type = "bind"
      source = abspath("./local_data_storage/kafka/3")
    }
}

resource "docker_container" "schema_registry" {
    name  = "schema-registry"
    image = "bitnami/schema-registry:7.4.7"
    hostname = "schema-registry"
    restart = "on-failure"
    max_retry_count = 5
    networks_advanced {
        name = docker_network.pyspark_workspace_network.name
    }
    env = [
        "SCHEMA_REGISTRY_DEBUG=true",
        "SCHEMA_REGISTRY_KAFKA_BROKERS=PLAINTEXT://kafka-1:9092,kafka-2:9092,kafka-3:9092",
        "ALLOW_PLAINTEXT_LISTENER=yes",
        "SCHEMA_REGISTRY_HOST_NAME=schema-registry",
        "SCHEMA_REGISTRY_LISTENERS=http://schema-registry:8085"
    ]
    ports {
        internal = 8085
        external = 8085  
    }
    mounts {
      target = "/bitnami"
      type = "bind"
      source = abspath("./local_data_storage/kafka/schema_registry")
    }
    depends_on = [ docker_container.kafka_1, docker_container.kafka_2, docker_container.kafka_3 ] 
}



resource "docker_container" "kafka_ui" {
    name  = "kafka-ui"
    image = "provectuslabs/kafka-ui:latest"
    networks_advanced {
        name = docker_network.pyspark_workspace_network.name
    }
    env = [
          "KAFKA_CLUSTERS_0_NAME=Kafka Cluster Sample",
          "DYNAMIC_CONFIG_ENABLED=true",
          "KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS=kafka-1:9092,kafka-2:9092,kafka-3:9092",
          "KAFKA_CLUSTERS_0_SCHEMAREGISTRY=http://schema-registry:8085"
    ]
    ports {
        internal = 8080
        external = 9090  
    }

    depends_on = [ docker_container.kafka_1, docker_container.kafka_2, docker_container.kafka_3, docker_container.schema_registry ] 

}


