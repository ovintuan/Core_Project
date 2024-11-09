-- SQL Server (Application Database)
DROP DATABASE IF EXISTS CreditLakehouseDB;
CREATE DATABASE CreditLakehouseDB;
USE CreditLakehouseDB;

-- Customer Table
CREATE TABLE Customer (
    CustomerID UNIQUEIDENTIFIER DEFAULT NEWID(),
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    DateOfBirth DATE,
    SSN VARCHAR(20), -- Consider encryption for sensitive data
    Ward NVARCHAR(100),
    District NVARCHAR(100),
    City NVARCHAR(100),
    PhoneNumber VARCHAR(20),
    Email VARCHAR(20),
    CreatedDate DATE DEFAULT GETDATE(),
    UpdateDate DATE DEFAULT GETDATE()
);

-- Option Set Master Table
CREATE TABLE OptionSetMaster (
    OptionSetID UNIQUEIDENTIFIER DEFAULT NEWID(),
    OptionSetName NVARCHAR(50),
    OptionSetValue NVARCHAR(50),
    Description NVARCHAR(500),
    ReferenceTable VARCHAR(50),
    ReferenceColumn VARCHAR(50),
    CreatedDate DATE DEFAULT GETDATE(),
    UpdateDate DATE DEFAULT GETDATE()
);

-- Product Table
CREATE TABLE Product (
    ProductID UNIQUEIDENTIFIER DEFAULT NEWID(),
    ProductName VARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    InterestRate DECIMAL(10,2), 
    ProductTypeID VARCHAR(50) REFERENCES OptionSetMaster(OptionSetID), -- e.g., Loan, Credit Card, Line of Credit
    CreatedDate DATE DEFAULT GETDATE(),
    UpdateDate DATE DEFAULT GETDATE()
);

-- CreditAccount Table
CREATE TABLE CreditAccount (
    AccountID UNIQUEIDENTIFIER DEFAULT NEWID(),
    CustomerID UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Customer(CustomerID),
    ProductID UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Product(ProductID),
    LimitAmount DECIMAL(18,2),
    Balance DECIMAL(18,2),
    OpenDate DATE,
    CloseDate DATE,
    StatusID VARCHAR(50) REFERENCES OptionSetMaster(OptionSetID), -- e.g., Active, Closed, Delinquent
    CreatedDate DATE DEFAULT GETDATE(),
    UpdateDate DATE DEFAULT GETDATE()
);

-- Transaction Table
CREATE TABLE Transaction (
    TransactionID UNIQUEIDENTIFIER DEFAULT NEWID(),
    AccountID INT FOREIGN KEY REFERENCES CreditAccount(AccountID),
    Amount DECIMAL(18,2),
    PaymentmethodID VARCHAR(50) REFERENCES OptionSetMaster(OptionSetID),
    TransactionTypeID VARCHAR(50) REFERENCES OptionSetMaster(OptionSetID),
    PaymentDate DATETIME,
    CreatedDate DATE DEFAULT GETDATE(),
    UpdateDate DATE DEFAULT GETDATE()
    
);

-- CreditHistory Table
CREATE TABLE CreditHistory (
    HistoryID UNIQUEIDENTIFIER DEFAULT NEWID(),
    AccountID INT FOREIGN KEY REFERENCES CreditAccount(AccountID),
    CreditScore INT,
    Date DATE
);

-- PaymentSchedule Table
CREATE TABLE PaymentSchedule (
    ScheduleID UNIQUEIDENTIFIER DEFAULT NEWID(),
    AccountID INT FOREIGN KEY REFERENCES CreditAccount(AccountID),
    DueDate DATE,
    AmountDue DECIMAL(18,2)
);

-- LatePayment Table
CREATE TABLE LatePayment (
    LatePaymentID UNIQUEIDENTIFIER DEFAULT NEWID(),
    AccountID INT FOREIGN KEY REFERENCES CreditAccount(AccountID),
    DueDate DATE,
    DaysLate INT
);

-- Collection Table
CREATE TABLE Collection (
    CollectionID UNIQUEIDENTIFIER DEFAULT NEWID(),
    AccountID INT FOREIGN KEY REFERENCES CreditAccount(AccountID),
    Date DATE,
    AmountCollected DECIMAL(18,2)
);

-- Underwriting Table
CREATE TABLE Underwriting (
    UnderwritingID UNIQUEIDENTIFIER DEFAULT NEWID(),
    AccountID INT FOREIGN KEY REFERENCES CreditAccount(AccountID),
    Date DATE,
    Decision VARCHAR(50), -- e.g., Approved, Denied
    Notes VARCHAR(500)
);

-- FraudDetection Table
CREATE TABLE FraudDetection (
    DetectionID UNIQUEIDENTIFIER DEFAULT NEWID(),
    AccountID INT FOREIGN KEY REFERENCES CreditAccount(AccountID),
    Date DATE,
    Type VARCHAR(50), -- e.g., Identity Theft, Unauthorized Use
    Details VARCHAR(500)
);

