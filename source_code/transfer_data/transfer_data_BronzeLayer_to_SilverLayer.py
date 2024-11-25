import os
import sys
sys.path.insert(0, r'/container/pyspark_workspace/source_code')
from utils.spark import SparkUtils
from pyspark.sql.window import Window
from pyspark.sql.functions import row_number

# Create a Spark session
spark_utils = SparkUtils()
spark = spark_utils.spark
sqlContext = spark_utils.sqlContext

# Load data from the Bronze layer
bronze_customer_product_account_df = spark.read.format('delta').load('/container/pyspark_workspace/local_data_storage/deltalake/bronze/CustomerProductAccount')
bronze_account_transaction_history_df = spark.read.format('delta').load('/container/pyspark_workspace/local_data_storage/deltalake/bronze/AccountTransactionHistory')
bronze_product_df = spark.read.format('delta').load('/container/pyspark_workspace/local_data_storage/deltalake/bronze/Product')
option_set_master_data_df = spark.read.format('delta').load('/container/pyspark_workspace/local_data_storage/deltalake/silver/OptionSetMaster')

# Transform and load data into the Silver layer

# Load Customer data
bronze_customer_product_account_df.createOrReplaceTempView("bronze_cpa")
option_set_master_data_df.createOrReplaceTempView("option_set")
silver_customer_df = spark.sql("""
    SELECT * FROM (
        SELECT DISTINCT 
            CustomerID, 
            FirstName, 
            LastName, 
            DateOfBirth, 
            SSN, 
            Ward, 
            District, 
            City, 
            PhoneNumber, 
            Email, 
            CreatedDate, 
            UpdateDate,
            ROW_NUMBER() OVER (PARTITION BY CustomerID ORDER BY CreatedDate DESC, UpdateDate DESC) AS row_number
        FROM bronze_cpa
    ) WHERE row_number = 1
""").drop("row_number")
silver_customer_df.write.format('delta').mode('overwrite').option('overwriteSchema', True).save('/container/pyspark_workspace/local_data_storage/deltalake/silver/Customer')

# Load CreditAccount data
silver_credit_account_df = spark.sql("""
    SELECT * FROM (
        SELECT DISTINCT 
            AccountID, 
            CustomerID, 
            ProductID, 
            LimitAmount, 
            Balance, 
            OpenDate, 
            CloseDate, 
            (SELECT FIRST(OptionSetID) FROM option_set WHERE OptionSetName = 'Status' AND OptionSetValue = cpa.Status) AS StatusID, 
            CreatedDate, 
            UpdateDate,
            ROW_NUMBER() OVER (PARTITION BY AccountID ORDER BY CreatedDate DESC, UpdateDate DESC) AS row_number
        FROM bronze_cpa cpa
    ) WHERE row_number = 1
""").drop("row_number")
silver_credit_account_df.write.format('delta').mode('overwrite').option('overwriteSchema', True).save('/container/pyspark_workspace/local_data_storage/deltalake/silver/CreditAccount')

# Load Transaction Payment data
bronze_account_transaction_history_df.createOrReplaceTempView("bronze_ath")
silver_transaction_payment_df = spark.sql("""
    SELECT * FROM (
        SELECT DISTINCT 
            TransactionID AS TransactionPaymentID, 
            AccountID, 
            Amount, 
            (SELECT FIRST(OptionSetID) FROM option_set WHERE OptionSetName = 'PaymentMethod' AND OptionSetValue = ath.Paymentmethod) AS PaymentmethodID, 
            (SELECT FIRST(OptionSetID) FROM option_set WHERE OptionSetName = 'TransactionType' AND OptionSetValue = ath.TransactionType) AS TransactionTypeID, 
            PaymentDate, 
            CreatedDate, 
            UpdateDate,
            ROW_NUMBER() OVER (PARTITION BY TransactionID ORDER BY CreatedDate DESC, UpdateDate DESC) AS row_number
        FROM bronze_ath ath
    ) WHERE row_number = 1
""").drop("row_number")
silver_transaction_payment_df.write.format('delta').mode('overwrite').option('overwriteSchema', True).save('/container/pyspark_workspace/local_data_storage/deltalake/silver/TransactionPayment')

# Load CreditHistory data
silver_credit_history_df = spark.sql("""
    SELECT * FROM (
        SELECT DISTINCT 
            HistoryID, 
            AccountID, 
            CreditScore, 
            HistoryDate,
            ROW_NUMBER() OVER (PARTITION BY HistoryID ORDER BY CreatedDate DESC, UpdateDate DESC) AS row_number
        FROM bronze_ath
    ) WHERE row_number = 1
""").drop("row_number")
silver_credit_history_df.write.format('delta').mode('overwrite').option('overwriteSchema', True).save('/container/pyspark_workspace/local_data_storage/deltalake/silver/CreditHistory')

# Load Product data
bronze_product_df.createOrReplaceTempView("bronze_product")
silver_product_df = spark.sql("""
    SELECT * FROM (
        SELECT DISTINCT 
            ProductID, 
            ProductName, 
            Description, 
            InterestRate, 
            (SELECT FIRST(OptionSetID) FROM option_set WHERE OptionSetName = 'ProductType' AND OptionSetValue = bronze_product.ProductType) AS ProductTypeID, 
            CreatedDate, 
            UpdateDate,
            ROW_NUMBER() OVER (PARTITION BY ProductID ORDER BY CreatedDate DESC, UpdateDate DESC) AS row_number
        FROM bronze_product
    ) WHERE row_number = 1
""").drop("row_number")
silver_product_df.write.format('delta').mode('overwrite').option('overwriteSchema', True).save('/container/pyspark_workspace/local_data_storage/deltalake/silver/Product')

# Load OptionSet data
option_set_master_data_df.createOrReplaceTempView("option_set")

# Stop the Spark session
spark_utils.stop_spark_session()