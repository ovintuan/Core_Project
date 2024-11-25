-- SQL Server (Data Warehouse - Gold Database)
USE CreditDW;

-- DimCustomer (Customer Dimension)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'DimCustomer' AND TABLE_SCHEMA = 'dbo')
CREATE TABLE dbo.DimCustomer (
    CustomerKey INT PRIMARY KEY IDENTITY(1,1), -- Surrogate Key
    CustomerID UNIQUEIDENTIFIER NOT NULL, -- Natural Key from Source System
    FullName AS CONCAT_WS(' ', LastName, FirstName),
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    DateOfBirth DATE,
    SSN VARCHAR(20),
    PhoneNumber VARCHAR(50),
    EmailAddress VARCHAR(100),
    StartDate DATE NOT NULL DEFAULT GETDATE(),  -- SCD Type 2
    EndDate DATE NOT NULL DEFAULT '9999-12-31', -- SCD Type 2
    IsCurrent BIT NOT NULL DEFAULT 1             -- SCD Type 2
);

-- DimProduct (Product Dimension)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'DimProduct' AND TABLE_SCHEMA = 'dbo')
CREATE TABLE dbo.DimProduct (
    ProductKey INT PRIMARY KEY IDENTITY(1,1), -- Surrogate Key
    ProductID UNIQUEIDENTIFIER NOT NULL UNIQUE, -- Natural Key from Source System
    ProductName VARCHAR(100) NOT NULL,
    Description VARCHAR(500),
    InterestRate DECIMAL(10,2),
    ProductType VARCHAR(50),
    StartDate DATE NOT NULL DEFAULT GETDATE(),  -- SCD Type 2
    EndDate DATE NOT NULL DEFAULT '9999-12-31', -- SCD Type 2
    IsCurrent BIT NOT NULL DEFAULT 1             -- SCD Type 2
);

-- DimAccount (Account Dimension)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'DimAccount' AND TABLE_SCHEMA = 'dbo')
CREATE TABLE dbo.DimAccount (
    AccountKey INT PRIMARY KEY IDENTITY(1,1), -- Surrogate Key
    AccountID UNIQUEIDENTIFIER NOT NULL UNIQUE, -- Natural Key from Source System
    CustomerID UNIQUEIDENTIFIER,
    ProductID UNIQUEIDENTIFIER,
    OpenDateKey INT,
    CloseDateKey INT,
    Status VARCHAR(50),
    StartDate DATE NOT NULL DEFAULT GETDATE(),  -- SCD Type 2
    EndDate DATE NOT NULL DEFAULT '9999-12-31', -- SCD Type 2
    IsCurrent BIT NOT NULL DEFAULT 1             -- SCD Type 2
);

-- DimDate (Date Dimension)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'DimDate' AND TABLE_SCHEMA = 'dbo')
CREATE TABLE dbo.DimDate (
    DateKey INT PRIMARY KEY, -- YYYYMMDD format
    Date DATE,
    Day INT,
    Month INT,
    Year INT,
    Quarter INT,
    Weekday VARCHAR(10)
);

-- FactTransactionPayment (Transaction Payment Fact Table)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'FactTransactionPayment' AND TABLE_SCHEMA = 'dbo')
CREATE TABLE dbo.FactTransactionPayment (
    TransactionPaymentID UNIQUEIDENTIFIER PRIMARY KEY,
    AccountKey INT,
    DateKey INT,
    Amount DECIMAL(18,2),
    TransactionType VARCHAR(50),
    ProductKey INT
);
