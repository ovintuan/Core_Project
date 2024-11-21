-- SQL Server (Silver Database)
USE CreditStagingDB;

-- CustomerProductAccount Table (Combination of Customer, Product, and CreditAccount)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CustomerProductAccount' AND TABLE_SCHEMA = 'dbo')
CREATE TABLE dbo.CustomerProductAccount (
    CustomerID UNIQUEIDENTIFIER,
    FirstName NVARCHAR(100),
    LastName NVARCHAR(100),
    DateOfBirth DATE,
    SSN VARCHAR(20),
    Ward NVARCHAR(100),
    District NVARCHAR(100),
    City NVARCHAR(100),
    PhoneNumber VARCHAR(50),
    Email VARCHAR(100),
    ProductID UNIQUEIDENTIFIER,
    ProductName VARCHAR(100),
    InterestRate DECIMAL(10,2),
    AccountID UNIQUEIDENTIFIER,
    LimitAmount DECIMAL(18,2),
    Balance DECIMAL(18,2),
    OpenDate DATE,
    CloseDate DATE,
    StatusID UNIQUEIDENTIFIER,
    CreatedDate DATE DEFAULT GETDATE(),
    UpdateDate DATE DEFAULT GETDATE(),
    CONSTRAINT PK_CustomerProductAccount PRIMARY KEY (CustomerID, ProductID, AccountID)
);

-- AccountTransactionHistory Table (Combination of CreditAccount, Transaction, and CreditHistory)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AccountTransactionHistory' AND TABLE_SCHEMA = 'dbo')
CREATE TABLE dbo.AccountTransactionHistory (
    AccountID UNIQUEIDENTIFIER,
    CustomerID UNIQUEIDENTIFIER,
    ProductID UNIQUEIDENTIFIER,
    LimitAmount DECIMAL(18,2),
    Balance DECIMAL(18,2),
    TransactionID UNIQUEIDENTIFIER,
    Amount DECIMAL(18,2),
    PaymentmethodID UNIQUEIDENTIFIER,
    TransactionTypeID UNIQUEIDENTIFIER,
    PaymentDate DATETIME2(7),
    HistoryID UNIQUEIDENTIFIER,
    CreditScore INT,
    HistoryDate DATE,
    CreatedDate DATE DEFAULT GETDATE(),
    UpdateDate DATE DEFAULT GETDATE(),
    CONSTRAINT PK_AccountTransactionHistory PRIMARY KEY (AccountID, TransactionID, HistoryID)
);

-- Product Table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Product' AND TABLE_SCHEMA = 'dbo')
CREATE TABLE dbo.Product (
    ProductID UNIQUEIDENTIFIER,
    ProductName VARCHAR(100),
    Description NVARCHAR(500),
    InterestRate DECIMAL(10,2),
    ProductType VARCHAR(50),
    CONSTRAINT PK_Product PRIMARY KEY (ProductID)
);
