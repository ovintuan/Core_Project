from pyspark.sql import SparkSession
from delta import *
from uuid import uuid4

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
    
    spark_submit_packages = [
        "io.delta:delta-core_2.12:2.1.0"
        ,"org.apache.spark:spark-avro_2.12:3.4.0"
        ,"org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.0"
        ]
    spark_submit_packages_str = ','.join(spark_submit_packages)
    print('spark_submit_packages_str:\n {spark_submit_packages_str}')

    spark_submit_extensions = [
        "io.delta.sql.DeltaSparkSessionExtension"
        ]
    spark_submit_extensions_str = ','.join(spark_submit_extensions)
    print('spark_submit_extensions_str:\n {spark_submit_extensions_str}')

    spark = SparkSession.builder.appName(session_id) \
        .master("spark://spark-master:7077")\
        .config("spark.jars.packages", spark_submit_packages_str)\
        .config("spark.sql.extensions", spark_submit_extensions_str) \
        .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")\
        .getOrCreate()
    sqlContext = SparkSession(spark)
    # Dont Show warning only error
    spark.sparkContext.setLogLevel("ERROR")
    return spark, sqlContext    