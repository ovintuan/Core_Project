from airflow import DAG
from airflow.providers.docker.operators.docker import DockerOperator
from datetime import datetime

# Define variables
container_name = 'python_environment'
command = 'python ./source_code/generate_data/insert_dummy_data_into_CreditStagingDB.py'
docker_url = 'unix://var/run/docker.sock'
network_mode = 'pyspark_workspace_network'
environment = {
    'dags_server_name': 'sqlserver_database_1',
    'dags_username': 'SA',
    'dags_password': 'SQL_Server_Password_1000'
}

default_args = {
    'owner': 'airflow',
    'start_date': datetime(2024, 11, 1),
    'retries': 1,
}

with DAG('step_1_import_data_dag', default_args=default_args, schedule_interval=None) as dag:
    airflow_task = DockerOperator(
        task_id='step_1_import_data_dag',
        container_name=container_name,
        api_version='auto',
        auto_remove=True,
        command=command,
        docker_url=docker_url,  # Kết nối Docker
        network_mode=network_mode,
        environment=environment
    )
    airflow_task
