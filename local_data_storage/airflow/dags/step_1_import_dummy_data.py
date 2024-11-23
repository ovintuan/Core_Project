from airflow import DAG
from airflow.providers.docker.operators.docker import DockerOperator
from airflow.operators.bash import BashOperator
from datetime import datetime

# Define variables
container_name = 'python_environment'
command = 'docker exec python_environment python ./source_code/transfer_data/transfer_data_Dummy_to_CreditStagingDB.py'
docker_url = 'unix://var/run/docker.sock'
network_mode = 'pyspark_workspace_network'
default_args = {
    'owner': 'airflow',
    'start_date': datetime(2024, 11, 1),
    'retries': 0,
}

with DAG('import_dummy_data', default_args=default_args, schedule_interval=None) as dag:
    execute_script = BashOperator(
        task_id='import_dummy_data',
        bash_command= command
    )
    execute_script