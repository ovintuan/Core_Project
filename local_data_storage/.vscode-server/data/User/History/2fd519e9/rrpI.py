import os
import subprocess

def download_spark_packages(output_dir, packages):
    """
    Download Spark packages and save them to a specified folder.
    
    Args:
        output_dir (str): Directory to store downloaded JARs.
        packages (list): List of Maven coordinates for the packages.
    """
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Build the --packages and --conf arguments for spark-submit
    packages_str = ",".join(packages)
    spark_submit_command = '/spark_command/bin/spark-submit'
    command = [
        spark_submit_command,
        "--packages", packages_str,
        "--conf", f"spark.jars={output_dir}/*",
        "--dry-run"
    ]

    print("Running command:", " ".join(command))
    # Execute spark-submit to trigger the download
    subprocess.run(command, check=True)
    print(f"Packages downloaded to {output_dir}")

# List of packages to download
spark_packages = [
    "io.delta:delta-core_2.12:2.1.0",
    "org.apache.spark:spark-avro_2.12:3.4.0",
    "org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.0"
]

# Specify the output directory
output_directory = "./local_data_storage/spark/jars"

# Download packages
download_spark_packages(output_directory, spark_packages)
