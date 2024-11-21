import pyodbc
import time
from generate_dummy_data import DummyDataGenerator
import os

# Retrieve input variables from Airflow task parameters

# Retrieve input variables from Airflow
server_name = os.getenv("dags_server_name")
database_name = 'CreditStagingDB'
username = os.getenv("dags_username")
password = os.getenv("dags_password")

# Database connection
connect_str = "DRIVER={ODBC Driver 17 for SQL Server};SERVER={};DATABASE={};UID={};PWD={}"\
                .format(server_name, database_name, username, password)
conn = pyodbc.connect(connect_str)

cursor = conn.cursor()

# Function to insert data into a table
def insert_data(table_name, data):
    columns = ', '.join(data[0].keys())
    placeholders = ', '.join(['?'] * len(data[0]))
    query = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
    for record in data:
        cursor.execute(query, tuple(record.values()))
    conn.commit()

generator = DummyDataGenerator()

for _ in range(100):
    customer_product_account_data, account_transaction_history_data = generator.generate_data(100)
    # Generate and insert data for CustomerProductAccount table
    insert_data('CustomerProductAccount', customer_product_account_data)
    # Generate and insert data for AccountTransactionHistory table
    insert_data('AccountTransactionHistory', account_transaction_history_data)
    time.sleep(5)  # Sleep for 5 seconds

# Close the database connection
conn.close()