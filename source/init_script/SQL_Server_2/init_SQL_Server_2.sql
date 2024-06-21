
-- SQL Server (Data Warehouse Database)
DROP DATABASE IF EXISTS CreditDW;
CREATE DATABASE CreditDW;
USE CreditDW;

-- DimCustomer (Customer Dimension)
CREATE TABLE DimCustomer (
    CustomerKey INT PRIMARY KEY IDENTITY(1,1), -- Surrogate Key
    CustomerID INT NOT NULL, -- Natural Key from Source System
    FullName NVARCHAR(100) DEFAULT CONCAT_WS(' ', LastName, FirstName),
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    DateOfBirth DATE,
    SSN VARCHAR(20),
    IDNumber VARCHAR(20),
    PhoneNumber VARCHAR(20),
    EmailAddress VARCHAR(50),
    StartDate DATE NOT NULL DEFAULT GETDATE(),  -- SCD Type 2
    EndDate DATE NOT NULL DEFAULT '9999-12-31', -- SCD Type 2
    IsCurrent BIT NOT NULL DEFAULT 1             -- SCD Type 2
);

-- Summary: Stores customer attributes, including a surrogate key, natural key from the source system, and start/end dates to track changes over time.

-- DimCustomerAddress (Customer Address Dimension)
CREATE TABLE DimCustomerAddress (
    CustomerAddressKey INT PRIMARY KEY IDENTITY(1,1), -- Surrogate Key
    CustomerID INT NOT NULL REFERENCES DimCustomer(CustomerKey), -- Natural Key from Source System
    FullAddress NVARCHAR(100) NOT NULL,
    WardKey INT NOT NULL REFERENCES DimWard(WardKey),
    DistrictKey INT NOT NULL REFERENCES DimCustomer(CustomerKey),
    CityKey INT NOT NULL REFERENCES DimCity(CityKey),
    StartDate DATE NOT NULL DEFAULT GETDATE(),  -- SCD Type 2
    EndDate DATE NOT NULL DEFAULT '9999-12-31', -- SCD Type 2
    IsCurrent BIT NOT NULL DEFAULT 1             -- SCD Type 2
);

-- Summary: Stores address attributes for customer, including a surrogate key, natural key from the source system, and start/end dates to track changes over time.

-- DimWard (Ward Dimension)
CREATE TABLE DimWard (
    WardKey INT PRIMARY KEY IDENTITY(1,1), -- Surrogate Key
    WardName NVARCHAR(50) NOT NULL,
    DistrictKey INT REFERENCES DimDistrict(DistrictKey),
    CreateDate DATE NOT NULL DEFAULT GETDATE(),
    IsActive INT 
);

-- Summary: Stores ward attributes, including a surrogate key, natural key from the source system, and start/end dates to track changes over time.

-- DimDistrict (District Dimension)
CREATE TABLE DimDistrict (
    DistrictKey INT PRIMARY KEY IDENTITY(1,1), -- Surrogate Key
    DistrictName NVARCHAR(50) NOT NULL,
    CityKey INT REFERENCES DimCity(CityKey),
    CreateDate DATE NOT NULL DEFAULT GETDATE(),
    IsActive INT 
);

-- Summary: Stores District attributes, including a surrogate key, natural key from the source system, and start/end dates to track changes over time.

-- DimCity (City Dimension)
CREATE TABLE DimCity (
    CityKey INT PRIMARY KEY IDENTITY(1,1), -- Surrogate Key
    CityName NVARCHAR(50) NOT NULL,
    CreateDate DATE NOT NULL DEFAULT GETDATE(),
    IsActive INT 
);

-- Summary: Stores District attributes, including a surrogate key, natural key from the source system, and start/end dates to track changes over time.

-- DimProduct (Product Dimension)
CREATE TABLE DimProduct (
    ProductKey INT PRIMARY KEY IDENTITY(1,1), -- Surrogate Key
    ProductID INT NOT NULL UNIQUE, -- Natural Key from Source System
    ProductName VARCHAR(100) NOT NULL,
    Description VARCHAR(500),
    InterestRate DECIMAL(10,2),
    ProductType VARCHAR(50),
    StartDate DATE NOT NULL DEFAULT GETDATE(),  -- SCD Type 2
    EndDate DATE NOT NULL DEFAULT '9999-12-31', -- SCD Type 2
    IsCurrent BIT NOT NULL DEFAULT 1             -- SCD Type 2
);

-- Summary: Stores product attributes, including a surrogate key, natural key, and start/end dates for tracking changes.


-- DimAccount (Account Dimension)
CREATE TABLE DimAccount (
    AccountKey INT PRIMARY KEY IDENTITY(1,1), -- Surrogate Key
    AccountID INT NOT NULL UNIQUE, -- Natural Key from Source System
    CustomerID INT FOREIGN KEY REFERENCES DimCustomer(CustomerKey),
    ProductID INT FOREIGN KEY REFERENCES DimProduct(ProductKey),
    OpenDateKey INT FOREIGN KEY REFERENCES DimDate(DateKey),
    CloseDateKey INT FOREIGN KEY REFERENCES DimDate(DateKey),
    Status VARCHAR(50),
    StartDate DATE NOT NULL DEFAULT GETDATE(),  -- SCD Type 2
    EndDate DATE NOT NULL DEFAULT '9999-12-31', -- SCD Type 2
    IsCurrent BIT NOT NULL DEFAULT 1             -- SCD Type 2
);

-- Summary: Stores account information, linking to customer and product dimensions, with open and close dates, status, and start/end dates for change tracking.


-- DimDate (Date Dimension)
CREATE TABLE DimDate (
    DateKey INT PRIMARY KEY, -- YYYYMMDD format
    Date DATE,
    Day INT,
    Month INT,
    Year INT,
    Quarter INT,
    Weekday VARCHAR(10)
);

-- Summary: Pre-populated table with dates to support time-based analysis, including day, month, year, quarter, and weekday attributes.


-- BridgeLatePayment (Bridge Table for Late Payments)
CREATE TABLE BridgeLatePayment (
    BridgeLatePaymentID INT PRIMARY KEY,
    AccountKey INT FOREIGN KEY REFERENCES DimAccount(AccountKey),
    LatePaymentID INT
);

-- Summary: Connects accounts to their late payments (many-to-many relationship).


-- BridgeCollection (Bridge Table for Collections)
CREATE TABLE BridgeCollection (
    BridgeCollectionID INT PRIMARY KEY,
    AccountKey INT FOREIGN KEY REFERENCES DimAccount(AccountKey),
    CollectionID INT
);

-- Summary: Connects accounts to their collection activities (many-to-many relationship).


-- BridgeUnderwriting (Bridge Table for Underwriting)
CREATE TABLE BridgeUnderwriting (
    BridgeUnderwritingID INT PRIMARY KEY,
    AccountKey INT FOREIGN KEY REFERENCES DimAccount(AccountKey),
    UnderwritingID INT
);

-- Summary: Connects accounts to their underwriting decisions (many-to-many relationship).

-- BridgeFraudDetection (Bridge Table for Fraud Detection)
CREATE TABLE BridgeFraudDetection (
    BridgeFraudDetectionID INT PRIMARY KEY,
    AccountKey INT FOREIGN KEY REFERENCES DimAccount(AccountKey),
    FraudDetectionID INT
);
-- Summary: Connects accounts to their fraud detection instances (many-to-many relationship).

-- FactTransaction (Transaction Fact Table)
CREATE TABLE FactTransaction (
    TransactionID INT PRIMARY KEY,
    AccountKey INT FOREIGN KEY REFERENCES DimAccount(AccountKey),
    DateKey INT FOREIGN KEY REFERENCES DimDate(DateKey),
    Amount DECIMAL(18,2),
    TransactionType VARCHAR(50),
    ProductKey INT FOREIGN KEY REFERENCES DimProduct(ProductKey)
);

-- Summary: Central fact table storing transaction details, linked to relevant dimensions using foreign keys.
