
import os
import sys
from datetime import datetime, timedelta
sys.path.insert(0, r'/container/pyspark_workspace/source_code')
from utils.spark import SparkUtils

# Create a Spark session
spark_utils = SparkUtils()
spark = spark_utils.spark
sqlContext = spark_utils.sqlContext

# Generate date range
start_date = datetime(2000, 1, 1)
end_date = datetime(2050, 12, 31)
date_generated = [start_date + timedelta(days=x) for x in range(0, (end_date - start_date).days + 1)]

# Create a DataFrame with date information
date_data = [(date.strftime('%Y%m%d'), date, date.day, date.month, date.year, (date.month - 1) // 3 + 1, date.isocalendar()[1], date.year + 1 if date.month > 6 else date.year) for date in date_generated]
columns = ["DateKey", "FullDate", "Day", "Month", "Year", "Quarter", "WeekOfYear", "FiscalYear"]

date_df = spark.createDataFrame(date_data, columns)

# Write the DataFrame to the Silver layer
date_df.write.format('delta').mode('overwrite').save('/container/pyspark_workspace/local_data_storage/deltalake/silver/Date')

# Stop the Spark session
spark_utils.stop_spark_session()