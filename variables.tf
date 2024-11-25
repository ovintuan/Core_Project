##########################################################################################
### Main.tf

variable "docker_host" {
  default = "tcp://localhost:2375"
  type    = string
}

variable "pyspark_image_name" {
  default = "pyspark_workspace"
  type    = string
  }

variable "pyspark_dockerfile" {
  default = "Dockerfile.pyspark_workspace"
  type    = string
}

variable "network_name" {
  default = "pyspark_workspace_network"
  type    = string
}

variable "volume_spark_master_opt_java" {
  default = "spark_master_opt_java"
  type    = string
}

variable "volume_spark_master_spark_command" {
  default = "spark_master_spark_command"
  type    = string
}

variable "volume_python_site_packages" {
  default = "python_site_packages"
  type    = string
}

variable "postgres_image" {
  default = "postgres:latest"
  type    = string
}

variable "postgres_port_internal" {
  default = 5432
  type    = number
}

variable "postgres_port_external" {
  default = 3000
  type    = number
}

variable "sqlserver_image" {
  default = "mcr.microsoft.com/mssql/server:2022-latest"
  type    = string
}

variable "sqlserver_hostname_1" {
  default = "sqlserver_database_1"
  type    = string
}

variable "sqlserver_hostname_2" {
  default = "sqlserver_database_2"
  type    = string
}

variable "sqlserver_port_internal" {
  default = 1433
  type    = number
}

variable "sqlserver_port_external_1" {
  default = 1000
  type    = number
}

variable "sqlserver_port_external_2" {
  default = 2000
  type    = number
}

variable "python_image" {
  default = "python:3.11.9"
  type    = string
}

variable "spark_master_webui_port" {
  default = 8080
  type    = number
}

variable "spark_master_port_internal" {
  default = 7077
  type    = number
}

variable "spark_master_port_external" {
  default = 8077
  type    = number
}

variable "spark_worker_webui_port_1" {
  default = 8081
  type    = number
}

variable "spark_worker_webui_port_2" {
  default = 8082
  type    = number
}

variable "postgres_hostname" {
  default = "postgres_database_1"
  type    = string
}

variable "volume_postgres_data" {
  default = "postgres_data"
  type    = string
}

locals {
  sqlserver1_env = { for env_var in regexall("(.*)=(.*)", file("./config_env_variables/sqlserver1.env")) : env_var[0] => env_var[1] }
  sqlserver2_env = { for env_var in regexall("(.*)=(.*)", file("./config_env_variables/sqlserver2.env")) : env_var[0] => env_var[1] }
  postgres_env   = { for env_var in regexall("(.*)=(.*)", file("./config_env_variables/postgres.env")) : env_var[0] => env_var[1] }
}

locals {
  sqlserver_sa_password_1 = local.sqlserver1_env["SA_PASSWORD"]
  sqlserver_sa_password_2 = local.sqlserver2_env["SA_PASSWORD"]
  postgres_user           = local.postgres_env["POSTGRES_USER"]
  postgres_password       = local.postgres_env["POSTGRES_PASSWORD"]
}



##########################################################################################
### kafka_cluster.tf

variable "kafka_image" {
  default = "bitnami/kafka:3.8.1"
  type    = string
}

variable "kafka_schema_registry_image" {
  default = "bitnami/schema-registry:7.4.7"
  type    = string
}

variable "kafka_ui_image" {
  default = "provectuslabs/kafka-ui:latest"
  type    = string
}

variable "kafka_ui_port_internal" {
  default = 8080
  type    = number
}

variable "kafka_ui_port_external" {
  default = 9090
  type    = number
}

variable "kafka_port" {
  default = 9092
  type    = number
}

variable "kafka_controller_port" {
  default = 9093
  type    = number
}

variable "kafka_schema_registry_port" {
  default = 8085
  type    = number
}

variable "kafka_schema_registry_hostname" {
  default = "schema-registry"
  type    = string
}

locals {
  kafka_bootstrap_servers = "kafka-1:${var.kafka_port},kafka-2:${var.kafka_port},kafka-3:${var.kafka_port}"
}

##########################################################################################
### airflow.tf

variable "airflow_image" {
  default = "apache/airflow:2.7.0"
  type    = string
}

variable "airflow_webserver_port_internal" {
  default = 8080
  type    = number
}

variable "airflow_webserver_port_external" {
  default = 6080
  type    = number
}

variable "airflow_scheduler_port_internal" {
  default = 8793
  type    = number
}

variable "airflow_scheduler_port_external" {
  default = 6793
  type    = number
}

variable "airflow_worker_port_internal" {
  default = 8794
  type    = number
}

variable "airflow_worker_port_external" {
  default = 6794
  type    = number
}

variable "airflow_triggerer_port_internal" {
  default = 8795
  type    = number
}

variable "airflow_triggerer_port_external" {
  default = 6795
  type    = number
}

variable "airflow_fernet_key" {
  default = ""
  type    = string
}

variable "airflow_ui_user" {
  default = "airflow_user"
  type    = string
}

variable "airflow_ui_password" {
  default = "airflow_password"
  type    = string
}

locals {
  airflow_metadata_db_host     = var.postgres_hostname
  airflow_metadata_db_port     = var.postgres_port_internal
  airflow_metadata_db_user     = local.postgres_user
  airflow_metadata_db_password = local.postgres_password
  airflow_metadata_db          = "airflow"
}



##########################################################################################
### debezium.tf

variable "debezium_image" {
  default = "debezium/connect:3.0.0.Final"
  type    = string
}

variable "debezium_port_internal" {
  default = 8083
  type    = number
}

variable "debezium_port_external" {
  default = 9083
  type    = number
}

# variable "kafka_bootstrap_servers" {
#   default = "kafka:9092"
#   type    = string
# }

variable "debezium_group_id" {
  default = "debezium"
  type    = string
}

variable "debezium_config_storage_topic" {
  default = "debezium_config"
  type    = string
}

variable "debezium_offset_storage_topic" {
  default = "debezium_offset"
  type    = string
}

variable "debezium_status_storage_topic" {
  default = "debezium_status"
  type    = string
}

variable "volume_debezium" {
  default = "debezium_history"
  type    = string
}

##########################################################################################

##########################################################################################