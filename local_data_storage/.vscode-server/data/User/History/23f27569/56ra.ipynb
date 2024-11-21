{
 "cells": [
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "from pyspark.sql import SparkSession\n",
    "from delta import *\n",
    "from uuid import uuid4"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "Spark"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "def createSparkSession():\n",
    "    session_id = str(uuid4())\n",
    "    \n",
    "    spark_submit_packages = [\n",
    "        \"io.delta:delta-core_2.12:2.1.0\"\n",
    "        ,\"org.apache.spark:spark-avro_2.12:3.4.0\"\n",
    "        ,\"org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.0\"\n",
    "        ]\n",
    "    spark_submit_packages_str = ','.join(spark_submit_packages)\n",
    "    print(spark_submit_packages_str)\n",
    "\n",
    "    spark_submit_extensions = [\n",
    "        \"io.delta.sql.DeltaSparkSessionExtension\"\n",
    "        ]\n",
    "    spark_submit_extensions_str = ','.join(spark_submit_extensions)\n",
    "    print(spark_submit_extensions_str)\n",
    "\n",
    "    spark = SparkSession.builder.appName(session_id) \\\n",
    "        .master(\"spark://spark-master:7077\")\\\n",
    "        .config(\"spark.jars.packages\", spark_submit_packages_str)\\\n",
    "        .config(\"spark.sql.extensions\", spark_submit_extensions_str) \\\n",
    "        .config(\"spark.sql.catalog.spark_catalog\", \"org.apache.spark.sql.delta.catalog.DeltaCatalog\")\\\n",
    "        .getOrCreate()\n",
    "    sqlContext = SparkSession(spark)\n",
    "    # Dont Show warning only error\n",
    "    spark.sparkContext.setLogLevel(\"ERROR\")\n",
    "    return spark, sqlContext"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "name": "python",
   "version": "3.11.9"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 2
}
