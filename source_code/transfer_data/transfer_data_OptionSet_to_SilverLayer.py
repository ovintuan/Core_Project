
import os
import sys
sys.path.insert(0, r'/container/pyspark_workspace/source_code')
from utils.spark import SparkUtils

# Create a Spark session
spark_utils = SparkUtils()
spark = spark_utils.spark
sqlContext = spark_utils.sqlContext

# Load the CSV file into a DataFrame
csv_file_path = '/container/pyspark_workspace/local_data_storage/master_data/OptionSetMasterData.csv'
option_set_master_data_df = spark.read.csv(csv_file_path, header=True, inferSchema=True)

# Write the DataFrame to the Silver layer
option_set_master_data_df.write.format('delta').mode('overwrite').save('/container/pyspark_workspace/local_data_storage/deltalake/silver/OptionSetMaster')

# Stop the Spark session
spark_utils.stop_spark_session()