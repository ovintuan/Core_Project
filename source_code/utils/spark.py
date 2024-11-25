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
        spark_submit_local_jars_str_display = '\n\t\t '.join(jar_files)
        print(f'spark_submit_local_jars_str:\n\t\t {spark_submit_local_jars_str_display}')

        spark_submit_jdbc_driver = [
            "mssql-jdbc-12.8.1.jre11.jar"
        ]
        spark_submit_jdbc_driver_str = ','.join([jar_path + i for i in spark_submit_jdbc_driver])
        spark_submit_jdbc_driver_str_display = '\n\t\t '.join([jar_path + i for i in spark_submit_jdbc_driver])
        print(f'spark_submit_jdbc_driver_str:\n\t\t {spark_submit_jdbc_driver_str_display}')

        spark_submit_extensions = [
            "io.delta.sql.DeltaSparkSessionExtension"
        ]
        spark_submit_extensions_str = ','.join(spark_submit_extensions)
        spark_submit_extensions_str_display = '\n\t\t '.join(spark_submit_extensions)
        print(f'spark_submit_extensions_str:\n\t\t {spark_submit_extensions_str_display}')

        spark = SparkSession.builder.appName(session_id) \
            .master("spark://spark-master:7077") \
            .config("spark.executor.cores", 2)  \
            .config("spark.executor.memory", "1g")  \
            .config("spark.driver.cores", 2)  \
            .config("spark.driver.memory", "1g")  \
            .config("spark.executor.instances", 2) \
            .config("spark.cores.max", 4) \
            .config("spark.jars", spark_submit_local_jars_str) \
            .config("spark.sql.extensions", spark_submit_extensions_str) \
            .config("spark.driver.extraClassPath", spark_submit_jdbc_driver_str) \
            .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
            .getOrCreate()
        sqlContext = SparkSession(spark)
        # Dont Show warning only error
        spark.sparkContext.setLogLevel("ERROR")
        return spark, sqlContext
    
    def stop_spark_session(self):
        if self.spark:
            self.spark.stop()
            print("Spark session stopped successfully")
            
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

    def execute_sql_script(self, system_name, database_name, sql_script):
        db_connection = DatabaseUtils.get_connection_from_json(system_name)
        db_host_name = db_connection['host_name']
        db_port = db_connection['port']
        db_username = db_connection['username']
        db_password = db_connection['password']
        db_type = db_connection['type']
        db_jdbc_url = f"jdbc:{db_type}://{db_host_name}:{db_port};databaseName={database_name};encrypt=true;trustServerCertificate=true"
        executor_connection = self.spark._sc._gateway.jvm.java.sql.DriverManager.getConnection(db_jdbc_url, db_username, db_password)
        # Tạo statement
        statement = executor_connection.createStatement()
        # Thực thi script
        statement.execute(sql_script)
        # Đóng kết nối
        statement.close()
        executor_connection.close()
        print(f"SQL script executed successfully! \n {sql_script.strip()}")
