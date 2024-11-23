resource "docker_container" "airflow_init_db" {
  name  = "airflow-init-db"
  image = var.airflow_image
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  rm   = true
  user = "50000:0"
  env = [
    "AIRFLOW__CORE__EXECUTOR=LocalExecutor",
    "AIRFLOW__CORE__LOAD_EXAMPLES=false",
    "AIRFLOW_UID=50000",
    "AIRFLOW_GID=0",
    "AIRFLOW__DATABASE__SQL_ALCHEMY_CONN=postgresql+psycopg2://${local.airflow_metadata_db_user}:${local.airflow_metadata_db_password}@${local.airflow_metadata_db_host}:${local.airflow_metadata_db_port}/${local.airflow_metadata_db}",
    "AIRFLOW__CORE__FERNET_KEY=${var.airflow_fernet_key}"
  ]
  command = ["airflow", "db", "init"]
  mounts {
    target = "/opt/airflow/dags"
    type   = "bind"
    source = abspath("./local_data_storage/airflow/dags")
  }
  mounts {
    target = "/opt/airflow/plugins"
    type   = "bind"
    source = abspath("./local_data_storage/airflow/plugins")
  }
  mounts {
    target = "/opt/airflow/logs"
    type   = "bind"
    source = abspath("./local_data_storage/airflow/logs")
  }
  depends_on = [docker_container.postgres_database_1]
}

resource "docker_container" "airflow_webserver" {
  name  = "airflow-webserver"
  image = var.airflow_image
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  user = "50000:0"
  env = [
    "_AIRFLOW_WWW_USER_USERNAME=${var.airflow_ui_user}",
    "_AIRFLOW_WWW_USER_PASSWORD=${var.airflow_ui_password}",
    "_AIRFLOW_WWW_USER_CREATE=true",
    "_AIRFLOW_DB_MIGRATE=true",
    "AIRFLOW__CORE__LOAD_EXAMPLES=false",
    "AIRFLOW_UID=50000",
    "AIRFLOW_GID=0",
    "AIRFLOW__CORE__EXECUTOR=LocalExecutor",
    "AIRFLOW__DATABASE__SQL_ALCHEMY_CONN=postgresql+psycopg2://${local.airflow_metadata_db_user}:${local.airflow_metadata_db_password}@${local.airflow_metadata_db_host}:${local.airflow_metadata_db_port}/${local.airflow_metadata_db}",
    "AIRFLOW__CORE__FERNET_KEY=${var.airflow_fernet_key}",
    "AIRFLOW__WEBSERVER__WORKERS=4"
  ]
  command = ["standalone"]
  ports {
    internal = var.airflow_webserver_port_internal
    external = var.airflow_webserver_port_external
  }
  mounts {
    target = "/opt/airflow/dags"
    type   = "bind"
    source = abspath("./local_data_storage/airflow/dags")
  }
  mounts {
    target = "/opt/airflow/plugins"
    type   = "bind"
    source = abspath("./local_data_storage/airflow/plugins")
  }
  mounts {
    target = "/opt/airflow/logs"
    type   = "bind"
    source = abspath("./local_data_storage/airflow/logs")
  }
  volumes {
    host_path      = "/var/run/docker.sock"
    container_path = "/var/run/docker.sock"
  }
  depends_on = [docker_container.postgres_database_1, docker_container.airflow_init_db]
}

# resource "docker_container" "airflow_scheduler" {
#   name  = "airflow-scheduler"
#   image = var.airflow_image
#   networks_advanced {
#     name = docker_network.pyspark_workspace_network.name
#   }
#   user = "50000:0"
#   env = [
#     "AIRFLOW_UID=50000",
#     "AIRFLOW_GID=0",
#     "AIRFLOW__CORE__EXECUTOR=LocalExecutor",
#     "AIRFLOW__DATABASE__SQL_ALCHEMY_CONN=postgresql+psycopg2://${local.airflow_metadata_db_user}:${local.airflow_metadata_db_password}@${local.airflow_metadata_db_host}:${local.airflow_metadata_db_port}/${local.airflow_metadata_db}",
#     "AIRFLOW__CORE__FERNET_KEY=${var.airflow_fernet_key}"
#   ]
#   command = ["scheduler"]
#   ports {
#     internal = var.airflow_scheduler_port_internal
#     external = var.airflow_scheduler_port_external
#   }
#   depends_on = [docker_container.postgres_database_1, docker_container.airflow_init_db]
# }

# resource "docker_container" "airflow_triggerer" {
#   name  = "airflow-triggerer"
#   image = var.airflow_image
#   networks_advanced {
#     name = docker_network.pyspark_workspace_network.name
#   }
#   user = "50000:0"
#   env = [
#     "AIRFLOW_UID=50000",
#     "AIRFLOW_GID=0",
#     "AIRFLOW__CORE__EXECUTOR=LocalExecutor",
#     "AIRFLOW__DATABASE__SQL_ALCHEMY_CONN=postgresql+psycopg2://${local.airflow_metadata_db_user}:${local.airflow_metadata_db_password}@${local.airflow_metadata_db_host}:${local.airflow_metadata_db_port}/${local.airflow_metadata_db}",
#     "AIRFLOW__CORE__FERNET_KEY=${var.airflow_fernet_key}"
#   ]
#   command = ["triggerer"]
#   ports {
#     internal = var.airflow_triggerer_port_internal
#     external = var.airflow_triggerer_port_external
#   }
#   depends_on = [docker_container.postgres_database_1, docker_container.airflow_init_db]
# }