import os
import sys
sys.path.insert(0, r'/container/pyspark_workspace/source_code')
from utils.spark import SparkUtils
from utils.datawarehouse import DataWarehouse
from pyspark.sql.utils import AnalysisException

# Create a Spark session
spark_utils = SparkUtils()
spark = spark_utils.spark
sqlContext = spark_utils.sqlContext
dw = DataWarehouse(spark)

# Define paths for Gold layer tables
gold_customer_path = '/container/pyspark_workspace/local_data_storage/deltalake/gold/DimCustomer'
gold_product_path = '/container/pyspark_workspace/local_data_storage/deltalake/gold/DimProduct'
gold_account_path = '/container/pyspark_workspace/local_data_storage/deltalake/gold/DimAccount'
gold_transaction_path = '/container/pyspark_workspace/local_data_storage/deltalake/gold/FactTransactionPayment'

# Initialize dimension tables if they do not exist
try:
    spark.read.format('delta').load(gold_customer_path)
except AnalysisException:
    dw.init_scd_table(spark.sql("SELECT * FROM delta.`/container/pyspark_workspace/local_data_storage/deltalake/silver/Customer`"), gold_customer_path)

try:
    spark.read.format('delta').load(gold_product_path)
except AnalysisException:
    dw.init_scd_table(spark.sql("SELECT * FROM delta.`/container/pyspark_workspace/local_data_storage/deltalake/silver/Product`"), gold_product_path)

try:
    spark.read.format('delta').load(gold_account_path)
except AnalysisException:
    dw.init_scd_table(spark.sql("SELECT * FROM delta.`/container/pyspark_workspace/local_data_storage/deltalake/silver/CreditAccount`"), gold_account_path)

try:
    spark.read.format('delta').load(gold_transaction_path)
except AnalysisException:
    dw.init_scd_table(spark.sql("SELECT * FROM delta.`/container/pyspark_workspace/local_data_storage/deltalake/silver/TransactionPayment`"), gold_transaction_path)

# Mapping Customer Data to DimCustomer
dim_customer_df = spark.sql("""
    SELECT 
        c.CustomerID, 
        CONCAT(c.LastName, ' ', c.FirstName) AS FullName, 
        c.FirstName, 
        c.LastName, 
        c.DateOfBirth, 
        c.SSN, 
        c.PhoneNumber, 
        c.Email AS EmailAddress
    FROM delta.`/container/pyspark_workspace/local_data_storage/deltalake/silver/Customer` c
""")

# Mapping Product Data to DimProduct
dim_product_df = spark.sql("""
    SELECT 
        p.ProductID, 
        p.ProductName, 
        p.Description, 
        p.InterestRate, 
        osm.OptionSetValue AS ProductType
    FROM delta.`/container/pyspark_workspace/local_data_storage/deltalake/silver/Product` p
    JOIN delta.`/container/pyspark_workspace/local_data_storage/deltalake/silver/OptionSetMaster` osm ON p.ProductTypeID = osm.OptionSetID
""")

# Mapping CreditAccount Data to DimAccount
dim_account_df = spark.sql("""
    SELECT 
        ca.AccountID, 
        ca.CustomerID, 
        ca.ProductID, 
        CONVERT(INT, FORMAT(ca.OpenDate, 'yyyyMMdd')) AS OpenDateKey, 
        CONVERT(INT, FORMAT(ca.CloseDate, 'yyyyMMdd')) AS CloseDateKey, 
        osm.OptionSetValue AS Status
    FROM delta.`/container/pyspark_workspace/local_data_storage/deltalake/silver/CreditAccount` ca
    JOIN delta.`/container/pyspark_workspace/local_data_storage/deltalake/silver/OptionSetMaster` osm ON ca.StatusID = osm.OptionSetID
""")

# Mapping Transaction Data to FactTransactionPayment
fact_transaction_payment_df = spark.sql("""
    SELECT 
        t.TransactionPaymentID, 
        da.AccountKey, 
        CONVERT(INT, FORMAT(t.PaymentDate, 'yyyyMMdd')) AS DateKey, 
        t.Amount, 
        osm.OptionSetValue AS TransactionType, 
        dp.ProductKey
    FROM delta.`/container/pyspark_workspace/local_data_storage/deltalake/silver/TransactionPayment` t
    JOIN delta.`/container/pyspark_workspace/local_data_storage/deltalake/gold/DimAccount` da ON t.AccountID = da.AccountID
    JOIN delta.`/container/pyspark_workspace/local_data_storage/deltalake/silver/OptionSetMaster` osm ON t.TransactionTypeID = osm.OptionSetID
    JOIN delta.`/container/pyspark_workspace/local_data_storage/deltalake/gold/DimProduct` dp ON dp.ProductID = (SELECT ca.ProductID FROM delta.`/container/pyspark_workspace/local_data_storage/deltalake/silver/CreditAccount` ca WHERE ca.AccountID = t.AccountID)
    WHERE NOT EXISTS (SELECT 1 FROM delta.`/container/pyspark_workspace/local_data_storage/deltalake/gold/FactTransactionPayment` ft WHERE ft.TransactionID = t.TransactionID)
""")

# Save the transformed data to the Gold layer using DataWarehouse class
dw.write_scd_type(gold_customer_path, dim_customer_df, ['CustomerID'])
dw.write_scd_type(gold_product_path, dim_product_df, ['ProductID'])
dw.write_scd_type(gold_account_path, dim_account_df, ['AccountID'])
fact_transaction_payment_df.write.format('delta').mode('overwrite').save(gold_transaction_path)

# Stop the Spark session
spark_utils.stop_spark_session()