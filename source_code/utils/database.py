import json


def get_connection_from_json(db_name):
    config_file = '/container/pyspark_workspace/source_code/utils/config_connection.json'
    with open(config_file, 'r') as file:
        config = json.load(file)
    if db_name not in config:
        raise ValueError(f"Database configuration for '{db_name}' not found in the config file.")
    connection = config[db_name]
    return connection
