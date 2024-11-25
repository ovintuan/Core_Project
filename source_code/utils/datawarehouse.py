from pyspark.sql import functions as ppsql_func

class DataWarehouse:
    def __init__(self, spark):
        self.spark = spark

    def write_scd_type(self, current_table_path, new_data_df, keyColumn):
        old_data_df = self.spark.read.format('delta').load(current_table_path)
        new_data_df = new_data_df.withColumn("HashKey", ppsql_func.sha2(ppsql_func.concat_ws("", *new_data_df.columns), 256))

        KeyColumnCondition = ' AND '.join([f'new.{i} = old.{i}' for i in keyColumn])
        SCD_Column = ['StartDate','EndDate','IsCurrent','ActionChangeType','ActionChangeTime', 'HashKey']
        ListColumn = [column_name for column_name in old_data_df.columns if column_name not in keyColumn and column_name not in SCD_Column]

        new_data_df.createOrReplaceTempView("new_data")
        old_data_df.filter("IsCurrent = 1").createOrReplaceTempView("old_data")

        insert_df_query = f"""
            SELECT 
            {','.join([f'new.{i}' for i in keyColumn])},
            {','.join([f'new.{i}' for i in ListColumn])},
            CAST(TO_DATE(FROM_UTC_TIMESTAMP(NOW(), 'GMT+7')) AS STRING) AS StartDate,
            '9999-12-31' AS EndDate,
            1 AS IsCurrent,
            'Insert' AS ActionChangeType,
            FROM_UTC_TIMESTAMP(NOW(), 'GMT+7') AS ActionChangeTime,
            new.HashKey
            FROM new_data new
            WHERE NOT EXISTS (SELECT 1 FROM old_data old WHERE ({KeyColumnCondition}))
        """
        # print(insert_df_query)
        insert_df = self.spark.sql(insert_df_query)

        update_df_query = f"""
            SELECT
            {','.join([f'new.{i}' for i in keyColumn])},
            {','.join([f'new.{i}' for i in ListColumn])},
            CAST(TO_DATE(FROM_UTC_TIMESTAMP(NOW(), 'GMT+7')) AS STRING) AS StartDate,
            '9999-12-31' AS EndDate,
            1 AS IsCurrent,
            'Update' AS ActionChangeType,
            FROM_UTC_TIMESTAMP(NOW(), 'GMT+7') AS ActionChangeTime,
            HashKey
            FROM new_data new
            WHERE EXISTS (SELECT 1 FROM old_data old WHERE ({KeyColumnCondition}) AND (old.HashKey != new.HashKey OR old.ActionChangeType = 'Delete'))
        """
        # print(update_df_query)
        update_df = self.spark.sql(update_df_query)

        delete_df_query = f"""
            SELECT
            {','.join([f'old.{i}' for i in keyColumn])},
            {','.join([f'old.{i}' for i in ListColumn])},
            CAST(TO_DATE(FROM_UTC_TIMESTAMP(NOW(), 'GMT+7')) AS STRING) AS StartDate,
            CAST(TO_DATE(FROM_UTC_TIMESTAMP(NOW(), 'GMT+7')) AS STRING) AS EndDate,
            1 AS IsCurrent,
            'Delete' AS ActionChangeType,
            FROM_UTC_TIMESTAMP(NOW(), 'GMT+7') AS ActionChangeTime,
            old.HashKey
            FROM old_data old
            WHERE NOT EXISTS (SELECT 1 FROM new_data new WHERE ({KeyColumnCondition}))
            AND old.ACTIONCHANGETYPE != 'Delete'
        """
        # print(delete_df_query)
        delete_df = self.spark.sql(delete_df_query)

        final_df = insert_df.union(update_df).union(delete_df)
        final_df.write.format('delta').mode('overwrite').option("overwriteSchema", True).save(f'{current_table_path}_CDC')
        final_df = self.spark.read.format('delta').load(f'{current_table_path}_CDC')

        self.spark.sql(f'''
            MERGE INTO delta.`{current_table_path}` AS old
            USING delta.`{current_table_path}_CDC` AS new
            ON old.id = new.id
            WHEN MATCHED AND (new.ActionChangeType IN ('Delete', 'Update') AND old.IsCurrent = 1)
            THEN UPDATE SET
                    old.EndDate = new.StartDate,
                    old.IsCurrent = 0
        ''')

        final_df.write.format('delta').mode('append').save(current_table_path)

    def init_scd_table(self, df, save_path):
        df_with_scd = df.withColumn('StartDate', ppsql_func.lit(None).cast('string')) \
                        .withColumn('EndDate', ppsql_func.lit(None).cast('string')) \
                        .withColumn('IsCurrent', ppsql_func.lit(None).cast('int')) \
                        .withColumn('ActionChangeType', ppsql_func.lit(None).cast('string')) \
                        .withColumn('ActionChangeTime', ppsql_func.lit(None).cast('timestamp')) \
                        .withColumn('HashKey', ppsql_func.lit(None).cast('string')) \
                        .filter('1=2')
        df_with_scd.write.format('delta').mode('overwrite').option('overwriteSchema', True).save(save_path)

# Example usage:
# spark = SparkSession.builder.appName("DataWarehouse").getOrCreate()
# dw = DataWarehouse(spark)
# dw.init_scd_table(df1, '/container/pyspark_workspace/local_data_storage/deltalake/TEMP_TABLE_B')
# dw.write_scd_type('/container/pyspark_workspace/local_data_storage/deltalake/TEMP_TABLE_B', df2, ['id', 'id2'])