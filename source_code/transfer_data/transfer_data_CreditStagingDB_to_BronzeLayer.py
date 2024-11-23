import os
import sys
sys.path.insert(0, r'/container/pyspark_workspace/source_code')
from utils.spark import SparkUtils

# Create a Spark session
spark_utils = SparkUtils()
spark = spark_utils.spark
sqlContext = spark_utils.sqlContext

# Extract data from CreditStagingDB and save it to the bronze layer

# Extract data from the CustomerProductAccount table
dbo_CustomerProductAccount_df = spark_utils.extract_df_database('sql_server_1', 'CreditStagingDB', 'SELECT * FROM dbo.CustomerProductAccount')
dbo_CustomerProductAccount_df.write.format('delta').mode('overwrite').save('/container/pyspark_workspace/local_data_storage/delta_lake/bronze/CustomerProductAccount')

# Extract data from the AccountTransactionHistory table
dbo_AccountTransactionHistory_df = spark_utils.extract_df_database('sql_server_1', 'CreditStagingDB', 'SELECT * FROM dbo.CustomerProductAccount')
dbo_AccountTransactionHistory_df.write.format('delta').mode('overwrite').save('/container/pyspark_workspace/local_data_storage/delta_lake/bronze/CustomerProductAccount')
