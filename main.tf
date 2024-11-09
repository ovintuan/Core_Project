terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "3.0.2"
    }
  }
}

provider "docker" {
  host = "tcp://localhost:2375"
}

resource "docker_image" "pyspark_workspace" {
  name = "pyspark_workspace"
  build {
    context = "."
    dockerfile = "Dockerfile.pyspark_workspace"
  }
}

resource "docker_network" "pyspark_workspace_network" {
  name = "pyspark_workspace_network"
}

resource "docker_volume" "spark_master_opt_java" {
  name = "spark_master_opt_java"
}

resource "docker_volume" "python_site_packages" {
  name = "python_site_packages"
}


locals {
  sqlserver_1_env = [for line in split("\n", file("./config_env_variables/sqlserver1.env")) : line if line != ""]
  sqlserver_2_env = [for line in split("\n", file("./config_env_variables/sqlserver2.env")) : line if line != ""]
  postgres_env    = [for line in split("\n", file("./config_env_variables/postgres.env")) : line if line != ""]
}

resource "docker_container" "spark_master" {
  name  = "spark-master"
  image = docker_image.pyspark_workspace.image_id
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  ports {
    internal = 8080
    external = 8080
  } 
  ports {
    internal = 7077
    external = 7077
  }
  env = [
    "SPARK_MODE=master",
    "SPARK_MASTER_PORT=7077",
    "SPARK_MASTER_WEBUI_PORT=8080"
  ]
  volumes {
    container_path = "/opt/bitnami/java"
    volume_name    = docker_volume.spark_master_opt_java.name
  }
  mounts {
    target = "/container/pyspark_workspace"
    type = "bind"
    source      = abspath(".")
  }
  depends_on = [docker_image.pyspark_workspace]
}

resource "docker_container" "spark_worker_1" {
  name  = "spark-worker-1"
  image = docker_image.pyspark_workspace.image_id
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  env = [
    "SPARK_MODE=worker",
    "SPARK_MASTER_URL=spark://spark-master:7077",
    "SPARK_WORKER_WEBUI_PORT=8081"
  ]
  mounts {
    target = "/container/pyspark_workspace"
    type = "bind"
    source      = abspath(".")
  }
  depends_on = [docker_container.spark_master, docker_image.pyspark_workspace]
}

resource "docker_container" "spark_worker_2" {
  name  = "spark-worker-2"
  image = docker_image.pyspark_workspace.image_id
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  env = [
    "SPARK_MODE=worker",
    "SPARK_MASTER_URL=spark://spark-master:7077",
    "SPARK_WORKER_WEBUI_PORT=8082"
  ]
  mounts {
    target = "/container/pyspark_workspace"
    type = "bind"
    source      = abspath(".")
  }
  depends_on = [docker_container.spark_master, docker_image.pyspark_workspace]
}

resource "docker_container" "python_environment" {
  name  = "python_environment"
  image = "python:3.11.9"
  stdin_open = true  # Keep STDIN open even if not attached
  tty = true         # Allocate a pseudo-TTY 
  working_dir = "/container/pyspark_workspace"
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  env = [
    "JAVA_HOME=/spark_opt_java/"
  ]
  volumes {
    container_path = "/spark_opt_java/"
    volume_name    = docker_volume.spark_master_opt_java.name
  }
  volumes {
    container_path = "/usr/local/lib/python3.11/site-packages"
    volume_name    = docker_volume.python_site_packages.name
  }
  mounts {
    target = "/root/.vscode-server"
    type   = "bind"
    source = abspath("./local_data_storage/.vscode-server")
  }
  mounts {
    target = "/container/pyspark_workspace"
    type   = "bind"
    source = abspath(".")
  }
  depends_on = [docker_container.spark_master, docker_image.pyspark_workspace]
  provisioner "local-exec" {
    command = "docker exec python_environment pip install -r source_code/requirements.txt"
  }
}

resource "docker_container" "postgres_database_1" {
  name  = "postgres_database_1"
  image = "postgres:latest"
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  ports {
    internal = 5432
    external = 3000
  }
  mounts {
    target = "/var/lib/postgresql/data"
    type   = "bind"
    source = abspath("./local_data_storage/postgres")
  }
  
  env = local.postgres_env
  # depends_on = [docker_image.pyspark_workspace]
}

resource "docker_container" "sqlserver_database_1" {
  name  = "sqlserver_database_1"
  image = "mcr.microsoft.com/mssql/server:2022-latest"
  user  = "0"
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  ports {
    internal = 1433
    external = 1000
  }
  env = concat(
    ["ACCEPT_EULA=Y"],
    local.sqlserver_1_env
  )
  mounts {
    target = "/var/opt/mssql/data"
    type   = "bind"
    source = abspath("./local_data_storage/sql_server_1")
  }
  
  # depends_on = [docker_image.pyspark_workspace]
}

resource "docker_container" "sqlserver_database_2" {
  name  = "sqlserver_database_2"
  image = "mcr.microsoft.com/mssql/server:2022-latest"
  user  = "0"
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  ports {
    internal = 1433
    external = 2000
  }
  env = concat(
    ["ACCEPT_EULA=Y"],
    local.sqlserver_2_env
  )
  mounts {
    target = "/var/opt/mssql/data"
    type   = "bind"
    source = abspath("./local_data_storage/sql_server_2")
  }
  
  # depends_on = [docker_image.pyspark_workspace]
}


