# import os
# import subprocess

# def download_spark_packages(output_dir, packages):
#     """
#     Download Spark packages and save them to a specified folder.
    
#     Args:
#         output_dir (str): Directory to store downloaded JARs.
#         packages (list): List of Maven coordinates for the packages.
#     """
#     # Ensure output directory exists
#     os.makedirs(output_dir, exist_ok=True)
    
#     # Build the --packages and --conf arguments for spark-submit
#     packages_str = ",".join(packages)
#     spark_submit_command = '/spark_command/bin/spark-submit'
#     command = [
#         spark_submit_command,
#         "--packages", packages_str,
#         "--conf", f"spark.jars={output_dir}/*",
#         "--dry-run"
#     ]

#     print("Running command:", " ".join(command))
#     # Execute spark-submit to trigger the download
#     subprocess.run(command, check=True)
#     print(f"Packages downloaded to {output_dir}")

# # List of packages to download
# spark_packages = [
#     "io.delta:delta-core_2.12:2.1.0",
#     "org.apache.spark:spark-avro_2.12:3.4.0",
#     "org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.0"
# ]

# # Specify the output directory
# output_directory = "./local_data_storage/spark/jars"

# # Download packages
# download_spark_packages(output_directory, spark_packages)


import os
import subprocess

def download_jar(artifact, destination_folder):
    """
    Tải xuống một JAR từ Maven Central bằng Maven.
    
    Args:
        artifact (str): Maven artifact (groupId:artifactId:version).
        destination_folder (str): Thư mục để lưu JAR.
    """
    # Tách groupId, artifactId, version từ artifact
    group_id, artifact_id, version = artifact.split(":")
    group_path = group_id.replace(".", "/")
    
    # Maven Central URL
    jar_url = f"https://repo1.maven.org/maven2/{group_path}/{artifact_id}/{version}/{artifact_id}-{version}.jar"
    
    # Tên file JAR
    jar_name = f"{artifact_id}-{version}.jar"
    jar_path = os.path.join(destination_folder, jar_name)
    
    # Tạo thư mục nếu chưa tồn tại
    os.makedirs(destination_folder, exist_ok=True)
    
    # Kiểm tra nếu JAR đã tồn tại
    if os.path.exists(jar_path):
        print(f"{jar_name} đã tồn tại trong {destination_folder}. Bỏ qua tải xuống.")
        return
    
    # Tải JAR
    print(f"Downloading {artifact} from {jar_url}...")
    subprocess.run(["curl", "-o", jar_path, jar_url], check=True)
    print(f"Saved to {jar_path}")

def main():
    # Danh sách các package cần tải
    spark_packages = [
        "io.delta:delta-core_2.12:2.1.0",
        "org.apache.spark:spark-avro_2.12:3.4.0",
        "org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.0",
    ]
    
    # Thư mục đích để lưu JAR
    destination_folder = "./jars"
    
    # Tải từng package
    for package in spark_packages:
        try:
            download_jar(package, destination_folder)
        except subprocess.CalledProcessError as e:
            print(f"Error downloading {package}: {e}")

if __name__ == "__main__":
    main()
