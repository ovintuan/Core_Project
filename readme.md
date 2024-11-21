
This project's information:
    Duties:
        - Domain data : Credit

        - Environment requirement:
            + Using docker
            + Can able to delivery to another laptop
            + Git to manage source code

        - Database requirement:
            + Prepare script init 3 database (with 50 sample data), requirement libraries,... to move environment.
            + 1 SQL Server for STG/Lake
            + 1 SQL server for Warehouse
            + 1 Postgres for Application (replicate 1:1 with STG or for something)
            + Using Docker to build SQL Server, Postgres 
        
        - Data pipeline requirement:
            + Using Python to develop for Data Pipeline to transfer Customer data
            + From Database A (SQL Server) to Database B1 (Postgres) when data change
            + From Database A (SQL Server) to Database B2 (SQL Server) when data warehouse logic
            + Database A is inputted data which submit on web/app (Streaming)
        
        - Web/App requirement:
            + login frame
            + submit data frame
            + approve/confirm data frame
            + search frame to query data

        - Using framework:
            + Apply DBT, Airflow fro workflow
            + Using FastAPI to query data in SQL Server 
        
        - Main purpose:
            ---> Desgin data system with data flow
    
    Optionals:
        - Apply owner framework to ETL
        - Linage data for our system
        - data visualize in dashboard (mayby on web)


Changed Logs:
    - Environment is using docker compose ---> change to use terraform



Kiến trúc tổng quan của một hệ thống Airflow hoàn chỉnh:
    Webserver - Giao diện người dùng để theo dõi và quản lý các DAG.
    Scheduler - Lập lịch và phân phối công việc cho các task.
    Executor - Thực thi các task (Celery hoặc Kubernetes Executor giúp phân tán).
    Worker - Xử lý các task song song.
    Metadata Database - Lưu trữ thông tin về các DAG, task, và trạng thái.
    Message Broker - Truyền tải thông tin giữa các thành phần trong hệ thống (nếu sử dụng Celery).
    CLI - Quản lý hệ thống qua dòng lệnh.
    Triggerer (Tùy chọn) - Hỗ trợ các task không đồng bộ.
