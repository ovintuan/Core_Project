import os
import sys
sys.path.insert(0, r'/container/pyspark_workspace/source_code')
from utils.spark import SparkUtils

# Create a Spark session
spark_utils = SparkUtils()
spark = spark_utils.spark
sqlContext = spark_utils.sqlContext

# Load data from the Silver layer
silver_customer_df = spark.read.format('delta').load('/container/pyspark_workspace/local_data_storage/deltalake/silver/Customer')
silver_credit_account_df = spark.read.format('delta').load('/container/pyspark_workspace/local_data_storage/deltalake/silver/CreditAccount')
silver_transaction_payment_df = spark.read.format('delta').load('/container/pyspark_workspace/local_data_storage/deltalake/silver/TransactionPayment')
silver_credit_history_df = spark.read.format('delta').load('/container/pyspark_workspace/local_data_storage/deltalake/silver/CreditHistory')
silver_product_df = spark.read.format('delta').load('/container/pyspark_workspace/local_data_storage/deltalake/silver/Product')
option_set_master_data_df = spark.read.format('delta').load('/container/pyspark_workspace/local_data_storage/deltalake/silver/OptionSetMaster')

# Truncate tables before writing data
spark_utils.execute_sql_script('sql_server_2', 'CreditLakehouseDB', 'TRUNCATE TABLE dbo.Customer')
spark_utils.execute_sql_script('sql_server_2', 'CreditLakehouseDB', 'TRUNCATE TABLE dbo.CreditAccount')
spark_utils.execute_sql_script('sql_server_2', 'CreditLakehouseDB', 'TRUNCATE TABLE dbo.TransactionPayment') 
spark_utils.execute_sql_script('sql_server_2', 'CreditLakehouseDB', 'TRUNCATE TABLE dbo.CreditHistory')
spark_utils.execute_sql_script('sql_server_2', 'CreditLakehouseDB', 'TRUNCATE TABLE dbo.Product')
spark_utils.execute_sql_script('sql_server_2', 'CreditLakehouseDB', 'TRUNCATE TABLE dbo.OptionSetMaster')

# Write data to the Lakehouse database
spark_utils.write_df_database('sql_server_2', 'CreditLakehouseDB', silver_customer_df, 'dbo.Customer')
spark_utils.write_df_database('sql_server_2', 'CreditLakehouseDB', silver_credit_account_df, 'dbo.CreditAccount')
spark_utils.write_df_database('sql_server_2', 'CreditLakehouseDB', silver_transaction_payment_df, 'dbo.TransactionPayment')
spark_utils.write_df_database('sql_server_2', 'CreditLakehouseDB', silver_credit_history_df, 'dbo.CreditHistory')
spark_utils.write_df_database('sql_server_2', 'CreditLakehouseDB', silver_product_df, 'dbo.Product')
spark_utils.write_df_database('sql_server_2', 'CreditLakehouseDB', option_set_master_data_df, 'dbo.OptionSetMaster')

# Stop the Spark session
spark_utils.stop_spark_session()