
import os
import sys
sys.path.insert(0, r'/container/pyspark_workspace/source_code')
from pyspark.sql import Row
from utils.spark import SparkUtils

# Create a Spark session
spark_utils = SparkUtils()
spark = spark_utils.spark
sqlContext = spark_utils.sqlContext

# Load the CSV file into a DataFrame
csv_file_path = '/container/pyspark_workspace/local_data_storage/master_data/ProductMasterData.csv'
product_master_data_df = spark.read.csv(csv_file_path, header=True, inferSchema=True)

# Write the DataFrame to the SQL Server database
spark_utils.execute_sql_script('sql_server_1', 'CreditStagingDB', 'TRUNCATE TABLE dbo.Product')
spark_utils.write_df_database('sql_server_1', 'CreditStagingDB', product_master_data_df, 'dbo.Product')

# Stop the Spark session
spark_utils.stop_spark_session()