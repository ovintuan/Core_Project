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
dbo_CustomerProductAccount_df.write.format('delta').mode('overwrite').option('overwriteSchema', True).save('/container/pyspark_workspace/local_data_storage/deltalake/bronze/CustomerProductAccount')

# Extract data from the AccountTransactionHistory table
dbo_AccountTransactionHistory_df = spark_utils.extract_df_database('sql_server_1', 'CreditStagingDB', 'SELECT * FROM dbo.AccountTransactionHistory')
dbo_AccountTransactionHistory_df.write.format('delta').mode('overwrite').option('overwriteSchema', True).save('/container/pyspark_workspace/local_data_storage/deltalake/bronze/AccountTransactionHistory')


# Extract data from the Product table
dbo_Product_df = spark_utils.extract_df_database('sql_server_1', 'CreditStagingDB', 'SELECT * FROM dbo.Product')
dbo_Product_df.write.format('delta').mode('overwrite').option('overwriteSchema', True).save('/container/pyspark_workspace/local_data_storage/deltalake/bronze/Product')

# Stop the Spark session
spark_utils.stop_spark_session()