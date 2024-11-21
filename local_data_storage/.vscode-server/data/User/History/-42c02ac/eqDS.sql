-- SQL Server (Silver Database)
USE CreditLakehouseDB;

-- Customer Table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Customer' AND TABLE_SCHEMA = 'dbo')
CREATE TABLE dbo.Customer (
    CustomerID UNIQUEIDENTIFIER DEFAULT NEWID(),
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    DateOfBirth DATE,
    SSN VARCHAR(20), -- Consider encryption for sensitive data
    Ward NVARCHAR(100),
    District NVARCHAR(100),
    City NVARCHAR(100),
    PhoneNumber VARCHAR(50),
    Email VARCHAR(100),
    CreatedDate DATE DEFAULT GETDATE(),
    UpdateDate DATE DEFAULT GETDATE(),
    CONSTRAINT PK_Customer PRIMARY KEY (CustomerID)
);

-- Option Set Master Table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'OptionSetMaster' AND TABLE_SCHEMA = 'dbo')
CREATE TABLE dbo.OptionSetMaster (
    OptionSetID UNIQUEIDENTIFIER DEFAULT NEWID(),
    OptionSetName NVARCHAR(50),
    OptionSetValue NVARCHAR(50),
    Description NVARCHAR(500),
    ReferenceTable VARCHAR(50),
    ReferenceColumn VARCHAR(50),
    CreatedDate DATE DEFAULT GETDATE(),
    UpdateDate DATE DEFAULT GETDATE(),
    CONSTRAINT PK_OptionSetMaster PRIMARY KEY (OptionSetID)
);

-- Product Table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Product' AND TABLE_SCHEMA = 'dbo')
CREATE TABLE dbo.Product (
    ProductID UNIQUEIDENTIFIER DEFAULT NEWID(),
    ProductName VARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    InterestRate DECIMAL(10,2), 
    ProductTypeID UNIQUEIDENTIFIER REFERENCES OptionSetMaster(OptionSetID), -- e.g., Loan, Credit Card, Line of Credit
    CreatedDate DATE DEFAULT GETDATE(),
    UpdateDate DATE DEFAULT GETDATE(),
    CONSTRAINT PK_Product PRIMARY KEY (ProductID)
);

-- CreditAccount Table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CreditAccount' AND TABLE_SCHEMA = 'dbo')
CREATE TABLE dbo.CreditAccount (
    AccountID UNIQUEIDENTIFIER DEFAULT NEWID(),
    CustomerID UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Customer(CustomerID),
    ProductID UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Product(ProductID),
    LimitAmount DECIMAL(18,2),
    Balance DECIMAL(18,2),
    OpenDate DATE,
    CloseDate DATE,
    StatusID UNIQUEIDENTIFIER REFERENCES OptionSetMaster(OptionSetID), -- e.g., Active, Closed, Delinquent
    CreatedDate DATE DEFAULT GETDATE(),
    UpdateDate DATE DEFAULT GETDATE(),
    CONSTRAINT PK_CreditAccount PRIMARY KEY (AccountID)
);

-- Transaction Table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Transaction' AND TABLE_SCHEMA = 'dbo')
CREATE TABLE dbo.Transaction (
    TransactionID UNIQUEIDENTIFIER DEFAULT NEWID(),
    AccountID UNIQUEIDENTIFIER FOREIGN KEY REFERENCES CreditAccount(AccountID),
    Amount DECIMAL(18,2),
    PaymentmethodID UNIQUEIDENTIFIER REFERENCES OptionSetMaster(OptionSetID),
    TransactionTypeID UNIQUEIDENTIFIER REFERENCES OptionSetMaster(OptionSetID),
    PaymentDate DATETIME2(7),
    CreatedDate DATE DEFAULT GETDATE(),
    UpdateDate DATE DEFAULT GETDATE(),
    CONSTRAINT PK_Transaction PRIMARY KEY (TransactionID)
);

-- CreditHistory Table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CreditHistory' AND TABLE_SCHEMA = 'dbo')
CREATE TABLE dbo.CreditHistory (
    HistoryID UNIQUEIDENTIFIER DEFAULT NEWID(),
    AccountID UNIQUEIDENTIFIER FOREIGN KEY REFERENCES CreditAccount(AccountID),
    CreditScore INT,
    Date DATE,
    CONSTRAINT PK_CreditHistory PRIMARY KEY (HistoryID)
);

