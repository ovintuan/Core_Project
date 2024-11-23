terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "3.0.2"
    }
  }
}

provider "docker" {
}

resource "docker_image" "pyspark_workspace" {
  name = var.pyspark_image_name
  build {
    context    = "."
    dockerfile = var.pyspark_dockerfile
  }
}

resource "docker_network" "pyspark_workspace_network" {
  name = var.network_name
}

resource "docker_volume" "spark_master_opt_java" {
  name = var.volume_spark_master_opt_java
}

resource "docker_volume" "spark_master_spark_command" {
  name = var.volume_spark_master_spark_command
}

resource "docker_volume" "python_site_packages" {
  name = var.volume_python_site_packages
}

resource "docker_container" "spark_master" {
  name  = "spark-master"
  image = docker_image.pyspark_workspace.image_id
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  ports {
    internal = var.spark_master_webui_port
    external = var.spark_master_webui_port
  }
  ports {
    internal = var.spark_master_port_internal
    external = var.spark_master_port_external
  }
  env = [
    "SPARK_MODE=master",
    "SPARK_MASTER_PORT=${var.spark_master_port_internal}",
    "SPARK_MASTER_WEBUI_PORT=${var.spark_master_webui_port}"
  ]
  volumes {
    container_path = "/opt/bitnami/java"
    volume_name    = docker_volume.spark_master_opt_java.name
  }
  volumes {
    container_path = "/opt/bitnami/spark/"
    volume_name    = docker_volume.spark_master_spark_command.name
  }
  mounts {
    target = "/container/pyspark_workspace"
    type   = "bind"
    source = abspath(".")
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
    "SPARK_MASTER_URL=spark://spark-master:${var.spark_master_port_internal}",
    "SPARK_WORKER_WEBUI_PORT=${var.spark_worker_webui_port_1}"
  ]
  mounts {
    target = "/container/pyspark_workspace"
    type   = "bind"
    source = abspath(".")
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
    "SPARK_MASTER_URL=spark://spark-master:${var.spark_master_port_internal}",
    "SPARK_WORKER_WEBUI_PORT=${var.spark_worker_webui_port_2}"
  ]
  mounts {
    target = "/container/pyspark_workspace"
    type   = "bind"
    source = abspath(".")
  }
  depends_on = [docker_container.spark_master, docker_image.pyspark_workspace]
}

resource "docker_container" "python_environment" {
  name        = "python_environment"
  image       = var.python_image
  stdin_open  = true
  tty         = true
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
    container_path = "/spark_command/"
    volume_name    = docker_volume.spark_master_spark_command.name
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
  provisioner "local-exec" {
    command = "docker exec python_environment pip install -r source_code/requirements.txt"
  }
  depends_on = [docker_container.spark_master, docker_image.pyspark_workspace]
}

resource "docker_container" "postgres_database_1" {
  name     = "postgres_database_1"
  image    = var.postgres_image
  hostname = var.postgres_hostname
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  env = [
    "POSTGRES_USER=${local.postgres_user}",
    "POSTGRES_PASSWORD=${local.postgres_password}"
  ]
  ports {
    internal = var.postgres_port_internal
    external = var.postgres_port_external
  }
  mounts {
    target = "/var/lib/postgresql/data"
    type   = "bind"
    source = abspath("./local_data_storage/postgres")
  }
  mounts {
    target = "/source_code/init_script/"
    type   = "bind"
    source = abspath("./source_code/init_script/")
  }
  provisioner "local-exec" {
    command = <<-EOT
      docker exec postgres_database_1 sleep 90
      docker exec postgres_database_1 psql -h localhost -U ${local.postgres_user} -f /source_code/init_script/AirFlow_Metadata/init_DB.sql
    EOT
    on_failure = continue
  }
}

resource "docker_container" "sqlserver_database_1" {
  name     = "sqlserver_database_1"
  image    = var.sqlserver_image
  hostname = var.sqlserver_hostname_1
  user     = "0"
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  ports {
    internal = var.sqlserver_port_internal
    external = var.sqlserver_port_external_1
  }
  env = [
    "ACCEPT_EULA=Y",
    "SA_PASSWORD=${local.sqlserver_sa_password_1}",
    "MSSQL_AGENT_ENABLED=true"
  ]
  mounts {
    target = "/var/opt/mssql/data"
    type   = "bind"
    source = abspath("./local_data_storage/sql_server_1")
    }
  mounts {
    target = "/source_code/init_script/"
    type   = "bind"
    source = abspath("./source_code/init_script/")
    }
  provisioner "local-exec" {
    command = <<-EOT
      docker exec sqlserver_database_1 sleep 90
      docker exec sqlserver_database_1 /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P ${local.sqlserver_sa_password_1} -i /source_code/init_script/SQL_Server_1/init_DB.sql
      docker exec sqlserver_database_1 /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P ${local.sqlserver_sa_password_1} -i /source_code/init_script/SQL_Server_1/init_DB_CreditStagingDB.sql
    EOT
  }
}

resource "docker_container" "sqlserver_database_2" {
  name     = "sqlserver_database_2"
  image    = var.sqlserver_image
  hostname = var.sqlserver_hostname_2
  user     = "0"
  networks_advanced {
    name = docker_network.pyspark_workspace_network.name
  }
  ports {
    internal = var.sqlserver_port_internal
    external = var.sqlserver_port_external_2
  }
  env = [
    "ACCEPT_EULA=Y",
    "SA_PASSWORD=${local.sqlserver_sa_password_2}",
    "MSSQL_AGENT_ENABLED=true"
  ]
  mounts {
    target = "/var/opt/mssql/data"
    type   = "bind"
    source = abspath("./local_data_storage/sql_server_2")
  }
  mounts {
    target = "/source_code/init_script/"
    type   = "bind"
    source = abspath("./source_code/init_script/")
  }
  provisioner "local-exec" {
    command = <<-EOT
      docker exec sqlserver_database_2 sleep 90
      docker exec sqlserver_database_2 /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P ${local.sqlserver_sa_password_2} -i /source_code/init_script/SQL_Server_2/init_DB.sql
      docker exec sqlserver_database_2 /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P ${local.sqlserver_sa_password_2} -i /source_code/init_script/SQL_Server_2/init_DB_CreditLakehouseDB.sql
      docker exec sqlserver_database_2 /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P ${local.sqlserver_sa_password_2} -i /source_code/init_script/SQL_Server_2/init_DB_CreditDW.sql
    EOT
  }
}