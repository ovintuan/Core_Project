from pyspark.sql import SparkSession
from delta import *
from uuid import uuid4
import os

# def createSparkSession():
#     session_id = str(uuid4())
    
#     spark_submit_packages = [
#         "io.delta:delta-core_2.12:2.1.0"
#         ,"org.apache.spark:spark-avro_2.12:3.4.0"
#         ,"org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.0"
#         ]
#     spark_submit_packages_str = ','.join(spark_submit_packages)
#     print('spark_submit_packages_str:\n {spark_submit_packages_str}')

#     spark_submit_extensions = [
#         "io.delta.sql.DeltaSparkSessionExtension"
#         ]
#     spark_submit_extensions_str = ','.join(spark_submit_extensions)
#     print('spark_submit_extensions_str:\n {spark_submit_extensions_str}')

#     spark = SparkSession.builder.appName(session_id) \
#         .master("spark://spark-master:7077")\
#         .config("spark.jars.packages", spark_submit_packages_str)\
#         .config("spark.sql.extensions", spark_submit_extensions_str) \
#         .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")\
#         .getOrCreate()
#     sqlContext = SparkSession(spark)
#     # Dont Show warning only error
#     spark.sparkContext.setLogLevel("ERROR")
#     return spark, sqlContext



def createSparkSession():
    session_id = str(uuid4())
    

    jar_path = '/container/pyspark_workspace/local_data_storage/spark/jars/'
    def list_jar_files(directory):
        return [directory + f for f in os.listdir(directory) if f.endswith('.jar')]
    
    jar_files = list_jar_files(jar_path)
    spark_submit_local_jars_str = ','.join(jar_files)
    print(f'spark_submit_local_jars_str:\n\t\t {spark_submit_local_jars_str}')
    
    spark_submit_jdbc_driver = [
        "mssql-jdbc-12.7.0.jar"        
        ]
    spark_submit_jdbc_driver_str = ','.join([jar_path + i + for i in spark_submit_jdbc_driver])
    print(f'spark_submit_jdbc_driver_str:\n\t\t {spark_submit_jdbc_driver_str}')

    spark_submit_extensions = [
        "io.delta.sql.DeltaSparkSessionExtension"
        ]
    spark_submit_extensions_str = ','.join(spark_submit_extensions)
    print(f'spark_submit_extensions_str:\n\t\t {spark_submit_extensions_str}')

    spark = SparkSession.builder.appName(session_id) \
        .master("spark://spark-master:7077")\
        .config("spark.jars", spark_submit_local_jars_str)\
        .config("spark.sql.extensions", spark_submit_extensions_str) \
        .config("spark.driver.extraClassPath", "/path/to/mysql-connector-java-8.0.33.jar") \
        .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")\
        .getOrCreate()
    sqlContext = SparkSession(spark)
    # Dont Show warning only error
    spark.sparkContext.setLogLevel("ERROR")
    return spark, sqlContext    