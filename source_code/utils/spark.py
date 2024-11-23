from pyspark.sql import SparkSession
from delta import *
from uuid import uuid4
import os
import sys
sys.path.insert(0, r'/container/pyspark_workspace/source_code')
import utils.database as DatabaseUtils

class SparkUtils:
    def __init__(self):
        self.spark, self.sqlContext = self.create_spark_session()

    def create_spark_session(self):
        session_id = str(uuid4())
        jar_path = '/container/pyspark_workspace/local_data_storage/spark/jars/'

        def list_jar_files(directory):
            return [directory + f for f in os.listdir(directory) if f.endswith('.jar')]

        jar_files = list_jar_files(jar_path)
        spark_submit_local_jars_str = ','.join(jar_files)
        print(f'spark_submit_local_jars_str:\n\t\t {spark_submit_local_jars_str}')

        spark_submit_jdbc_driver = [
            "mssql-jdbc-12.8.1.jre11.jar"
        ]
        spark_submit_jdbc_driver_str = ','.join([jar_path + i for i in spark_submit_jdbc_driver])
        print(f'spark_submit_jdbc_driver_str:\n\t\t {spark_submit_jdbc_driver_str}')

        spark_submit_extensions = [
            "io.delta.sql.DeltaSparkSessionExtension"
        ]
        spark_submit_extensions_str = ','.join(spark_submit_extensions)
        print(f'spark_submit_extensions_str:\n\t\t {spark_submit_extensions_str}')

        spark = SparkSession.builder.appName(session_id) \
            .master("spark://spark-master:7077") \
            .config("spark.jars", spark_submit_local_jars_str) \
            .config("spark.sql.extensions", spark_submit_extensions_str) \
            .config("spark.driver.extraClassPath", spark_submit_jdbc_driver_str) \
            .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
            .getOrCreate()
        sqlContext = SparkSession(spark)
        # Dont Show warning only error
        spark.sparkContext.setLogLevel("ERROR")
        return spark, sqlContext

    def extract_df_database(self, system_name, database_name, query):
        db_connection = DatabaseUtils.get_connection_from_json(system_name)
        db_host_name = db_connection['host_name']
        db_port = db_connection['port']
        db_username = db_connection['username']
        db_password = db_connection['password']
        db_type = db_connection['type']
        db_jdbc_url = f"jdbc:{db_type}://{db_host_name}:{db_port};databaseName={database_name}"

        df = self.spark.read \
            .format("jdbc") \
            .option("url", db_jdbc_url) \
            .option("query", query) \
            .option("user", db_username) \
            .option("password", db_password) \
            .option("encrypt", True) \
            .option("trustServerCertificate", True) \
            .load()
        return df

    def write_df_database(self, system_name, database_name, df, table_name):
        db_connection = DatabaseUtils.get_connection_from_json(system_name)
        db_host_name = db_connection['host_name']
        db_port = db_connection['port']
        db_username = db_connection['username']
        db_password = db_connection['password']
        db_type = db_connection['type']
        db_jdbc_url = f"jdbc:{db_type}://{db_host_name}:{db_port};databaseName={database_name}"
        (
            df.write
            .format("jdbc")
            .option("url", db_jdbc_url)
            .option("dbtable", table_name)
            .option("user", db_username)
            .option("password", db_password)
            .option("encrypt", True)
            .option("trustServerCertificate", True)
            .mode("append")
            .save()
        )
        print(f'Data inserted successfully into {table_name}')