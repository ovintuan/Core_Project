
import os
import sys
sys.path.insert(0, r'/container/pyspark_workspace/source_code')
from pyspark.sql import Row
from utils.spark import SparkUtils
from generate_data.generate_dummy_data import DummyDataGenerator


# Create a Spark session
spark_utils = SparkUtils()
spark = spark_utils.spark
sqlContext = spark_utils.sqlContext

# Create a DummyDataGenerator object
generator = DummyDataGenerator()
for _ in range(1):
    customer_product_account_data, account_transaction_history_data = generator.generate_data(20)
    # Generate and insert data for CustomerProductAccount table
    customer_product_account_df = spark.createDataFrame([Row(**i) for i in customer_product_account_data])
    spark_utils.write_df_database('sql_server_1', 'CreditStagingDB', customer_product_account_df, 'dbo.CustomerProductAccount')
    
    # Generate and insert data for AccountTransactionHistory table
    account_transaction_history_df = spark.createDataFrame([Row(**i) for i in account_transaction_history_data])
    spark_utils.write_df_database('sql_server_1', 'CreditStagingDB', account_transaction_history_df, 'dbo.AccountTransactionHistory')

    # time.sleep(5)  # Sleep for 5 seconds
    print('Data inserted successfully')

# Stop the Spark session
spark_utils.stop_spark_session()