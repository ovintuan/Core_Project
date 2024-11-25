USE CreditStagingDB;

-- Mapping CustomerProductAccount Data to Customer and CreditAccount
INSERT INTO CreditLakehouseDB.dbo.Customer (CustomerID, FirstName, LastName, DateOfBirth, SSN, Ward, District, City, PhoneNumber, Email, CreatedDate, UpdateDate)
SELECT DISTINCT 
    cpa.CustomerID, 
    cpa.FirstName, 
    cpa.LastName, 
    cpa.DateOfBirth, 
    cpa.SSN, 
    cpa.Ward, 
    cpa.District, 
    cpa.City, 
    cpa.PhoneNumber, 
    cpa.Email, 
    cpa.CreatedDate, 
    cpa.UpdateDate
FROM CreditStagingDB.dbo.CustomerProductAccount cpa
WHERE NOT EXISTS (SELECT 1 FROM CreditLakehouseDB.dbo.Customer c WHERE c.CustomerID = cpa.CustomerID);

INSERT INTO CreditLakehouseDB.dbo.CreditAccount (AccountID, CustomerID, ProductID, LimitAmount, Balance, OpenDate, CloseDate, StatusID, CreatedDate, UpdateDate)
SELECT DISTINCT 
    cpa.AccountID, 
    cpa.CustomerID, 
    cpa.ProductID, 
    cpa.LimitAmount, 
    cpa.Balance, 
    cpa.OpenDate, 
    cpa.CloseDate, 
    (SELECT OptionSetID FROM CreditLakehouseDB.dbo.OptionSet WHERE OptionSetName = 'Status' AND OptionSetValue = cpa.StatusID) AS StatusID, 
    cpa.CreatedDate, 
    cpa.UpdateDate
FROM CreditStagingDB.dbo.CustomerProductAccount cpa
WHERE NOT EXISTS (SELECT 1 FROM CreditLakehouseDB.dbo.CreditAccount ca WHERE ca.AccountID = cpa.AccountID);

-- Mapping AccountTransactionHistory Data to Transaction and CreditHistory
INSERT INTO CreditLakehouseDB.dbo.Transaction (TransactionID, AccountID, Amount, PaymentmethodID, TransactionTypeID, PaymentDate, CreatedDate, UpdateDate)
SELECT DISTINCT 
    ath.TransactionID, 
    ath.AccountID, 
    ath.Amount, 
    (SELECT OptionSetID FROM CreditLakehouseDB.dbo.OptionSet WHERE OptionSetName = 'PaymentMethod' AND OptionSetValue = ath.PaymentmethodID) AS PaymentmethodID, 
    (SELECT OptionSetID FROM CreditLakehouseDB.dbo.OptionSet WHERE OptionSetName = 'TransactionType' AND OptionSetValue = ath.TransactionTypeID) AS TransactionTypeID, 
    ath.PaymentDate, 
    ath.CreatedDate, 
    ath.UpdateDate
FROM CreditStagingDB.dbo.AccountTransactionHistory ath
WHERE NOT EXISTS (SELECT 1 FROM CreditLakehouseDB.dbo.Transaction t WHERE t.TransactionID = ath.TransactionID);

INSERT INTO CreditLakehouseDB.dbo.CreditHistory (HistoryID, AccountID, CreditScore, Date)
SELECT DISTINCT 
    ath.HistoryID, 
    ath.AccountID, 
    ath.CreditScore, 
    ath.HistoryDate
FROM CreditStagingDB.dbo.AccountTransactionHistory ath
WHERE NOT EXISTS (SELECT 1 FROM CreditLakehouseDB.dbo.CreditHistory ch WHERE ch.HistoryID = ath.HistoryID);

-- Mapping Product Data to Product
INSERT INTO CreditLakehouseDB.dbo.Product (ProductID, ProductName, Description, InterestRate, ProductType, CreatedDate, UpdateDate)
SELECT DISTINCT 
    p.ProductID, 
    p.ProductName, 
    p.Description, 
    p.InterestRate, 
    (SELECT OptionSetID FROM CreditLakehouseDB.dbo.OptionSet WHERE OptionSetName = 'ProductType' AND OptionSetValue = p.ProductType) AS ProductTypeID, 
    GETDATE() AS CreatedDate, 
    GETDATE() AS UpdateDate
FROM CreditStagingDB.dbo.Product p
WHERE NOT EXISTS (SELECT 1 FROM CreditLakehouseDB.dbo.Product pr WHERE pr.ProductID = p.ProductID);

-- Mapping OptionSet Data to OptionSet
INSERT INTO CreditLakehouseDB.dbo.OptionSet (OptionSetID, OptionSetName, OptionSetValue, CreatedDate, UpdateDate)
SELECT DISTINCT 
    os.OptionSetID, 
    os.OptionSetName, 
    os.OptionSetValue, 
    GETDATE() AS CreatedDate, 
    GETDATE() AS UpdateDate
FROM CreditStagingDB.dbo.OptionSet os
WHERE NOT EXISTS (SELECT 1 FROM CreditLakehouseDB.dbo.OptionSet o WHERE o.OptionSetID = os.OptionSetID);
