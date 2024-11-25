
import os
import sys
sys.path.insert(0, r'/container/pyspark_workspace/source_code')
from utils.spark import SparkUtils

# Create a Spark session
spark_utils = SparkUtils()
spark = spark_utils.spark
sqlContext = spark_utils.sqlContext

# Define paths for Gold layer tables
gold_customer_path = '/container/pyspark_workspace/local_data_storage/deltalake/gold/DimCustomer'
gold_product_path = '/container/pyspark_workspace/local_data_storage/deltalake/gold/DimProduct'
gold_account_path = '/container/pyspark_workspace/local_data_storage/deltalake/gold/DimAccount'
gold_transaction_path = '/container/pyspark_workspace/local_data_storage/deltalake/gold/FactTransactionPayment'
gold_date_path = '/container/pyspark_workspace/local_data_storage/deltalake/gold/DimDate'

# Load data from the Gold layer
gold_customer_df = spark.read.format('delta').load(gold_customer_path)
gold_product_df = spark.read.format('delta').load(gold_product_path)
gold_account_df = spark.read.format('delta').load(gold_account_path)
gold_transaction_df = spark.read.format('delta').load(gold_transaction_path)
gold_date_df = spark.read.format('delta').load(gold_date_path)

# Define SQL Server connection properties
sql_server_name = 'sql_server_2'
database_name = 'CreditDWDB'

# Write data to SQL Server using SparkUtils functions
spark_utils.write_df_database(sql_server_name, database_name, gold_customer_df, 'dbo.DimCustomer')
spark_utils.write_df_database(sql_server_name, database_name, gold_product_df, 'dbo.DimProduct')
spark_utils.write_df_database(sql_server_name, database_name, gold_account_df, 'dbo.DimAccount')
spark_utils.write_df_database(sql_server_name, database_name, gold_transaction_df, 'dbo.FactTransactionPayment')
spark_utils.write_df_database(sql_server_name, database_name, gold_date_df, 'dbo.DimDate')

# Stop the Spark session
spark_utils.stop_spark_session()