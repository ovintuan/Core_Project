
##### SQL Server
FROM mcr.microsoft.com/mssql/server:2022-latest

# Set environment variables (consult SQL Server documentation)
ENV ACCEPT_EULA=Y
ENV SA_PASSWORD=SQL_Server_Password_1000


#### Postgres
FROM postgres:latest

# Set environment variables (optional)
ENV POSTGRES_PASSWORD=Postgres_Password_2000
ENV POSTGRES_USER=Postgres_User
# ENV POSTGRES_DB=your_postgres_database

# # Create the database (optional)
# RUN postgresql-configure --username=$POSTGRES_USER --default-authentication=md5
# RUN createdb -U $POSTGRES_USER $POSTGRES_DB
