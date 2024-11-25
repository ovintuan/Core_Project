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
        print(f"{jar_name} is existed. Skipping this package.")
        return
    
    # Tải JAR
    print(f"Downloading {artifact} from {jar_url}...")
    subprocess.run(["curl", "-o", jar_path, jar_url], check=True)
    print(f"Saved to {jar_path}")

def main():
    # Danh sách các package cần tải
    spark_packages = [
        "io.delta:delta-storage:3.2.0",
        "io.delta:delta-spark_2.12:3.2.0",
        "org.apache.spark:spark-avro_2.12:3.4.0",
        "org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.0",
        "com.microsoft.sqlserver:mssql-jdbc:12.8.1.jre11",
    ]
    
    # Thư mục đích để lưu JAR
    destination_folder = "/container/pyspark_workspace/local_data_storage/spark/jars/"
    
    # Tải từng package
    for package in spark_packages:
        try:
            download_jar(package, destination_folder)
        except subprocess.CalledProcessError as e:
            print(f"Error downloading {package}: {e}")

if __name__ == "__main__":
    main()
