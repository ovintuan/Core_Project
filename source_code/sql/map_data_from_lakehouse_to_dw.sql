USE CreditLakehouseDB;

-- Mapping Customer Data to DimCustomer using SCD Type 2
MERGE CreditDW.dbo.DimCustomer AS target
USING (
    SELECT 
        c.CustomerID, 
        CONCAT(c.LastName, ' ', c.FirstName) AS FullName, 
        c.FirstName, 
        c.LastName, 
        c.DateOfBirth, 
        c.SSN, 
        c.PhoneNumber, 
        c.Email AS EmailAddress, 
        GETDATE() AS StartDate, 
        '9999-12-31' AS EndDate, 
        1 AS IsCurrent
    FROM CreditLakehouseDB.dbo.Customer c
) AS source
ON target.CustomerID = source.CustomerID AND target.IsCurrent = 1
WHEN MATCHED AND (
    target.FullName <> source.FullName OR
    target.FirstName <> source.FirstName OR
    target.LastName <> source.LastName OR
    target.DateOfBirth <> source.DateOfBirth OR
    target.SSN <> source.SSN OR
    target.PhoneNumber <> source.PhoneNumber OR
    target.EmailAddress <> source.EmailAddress
) THEN
    UPDATE SET 
        target.EndDate = GETDATE(),
        target.IsCurrent = 0
WHEN NOT MATCHED BY TARGET THEN
    INSERT (CustomerID, FullName, FirstName, LastName, DateOfBirth, SSN, PhoneNumber, EmailAddress, StartDate, EndDate, IsCurrent)
    VALUES (source.CustomerID, source.FullName, source.FirstName, source.LastName, source.DateOfBirth, source.SSN, source.PhoneNumber, source.EmailAddress, source.StartDate, source.EndDate, source.IsCurrent);

-- Mapping Product Data to DimProduct using SCD Type 2
MERGE CreditDW.dbo.DimProduct AS target
USING (
    SELECT 
        p.ProductID, 
        p.ProductName, 
        p.Description, 
        p.InterestRate, 
        osm.OptionSetValue AS ProductType, 
        GETDATE() AS StartDate, 
        '9999-12-31' AS EndDate, 
        1 AS IsCurrent
    FROM CreditLakehouseDB.dbo.Product p
    JOIN CreditLakehouseDB.dbo.OptionSetMaster osm ON p.ProductTypeID = osm.OptionSetID
) AS source
ON target.ProductID = source.ProductID AND target.IsCurrent = 1
WHEN MATCHED AND (
    target.ProductName <> source.ProductName OR
    target.Description <> source.Description OR
    target.InterestRate <> source.InterestRate OR
    target.ProductType <> source.ProductType
) THEN
    UPDATE SET 
        target.EndDate = GETDATE(),
        target.IsCurrent = 0
WHEN NOT MATCHED BY TARGET THEN
    INSERT (ProductID, ProductName, Description, InterestRate, ProductType, StartDate, EndDate, IsCurrent)
    VALUES (source.ProductID, source.ProductName, source.Description, source.InterestRate, source.ProductType, source.StartDate, source.EndDate, source.IsCurrent);

-- Mapping CreditAccount Data to DimAccount using SCD Type 2
MERGE CreditDW.dbo.DimAccount AS target
USING (
    SELECT 
        ca.AccountID, 
        ca.CustomerID, 
        ca.ProductID, 
        CONVERT(INT, FORMAT(ca.OpenDate, 'yyyyMMdd')) AS OpenDateKey, 
        CONVERT(INT, FORMAT(ca.CloseDate, 'yyyyMMdd')) AS CloseDateKey, 
        osm.OptionSetValue AS Status, 
        GETDATE() AS StartDate, 
        '9999-12-31' AS EndDate, 
        1 AS IsCurrent
    FROM CreditLakehouseDB.dbo.CreditAccount ca
    JOIN CreditLakehouseDB.dbo.OptionSetMaster osm ON ca.StatusID = osm.OptionSetID
) AS source
ON target.AccountID = source.AccountID AND target.IsCurrent = 1
WHEN MATCHED AND (
    target.CustomerID <> source.CustomerID OR
    target.ProductID <> source.ProductID OR
    target.OpenDateKey <> source.OpenDateKey OR
    target.CloseDateKey <> source.CloseDateKey OR
    target.Status <> source.Status
) THEN
    UPDATE SET 
        target.EndDate = GETDATE(),
        target.IsCurrent = 0
WHEN NOT MATCHED BY TARGET THEN
    INSERT (AccountID, CustomerID, ProductID, OpenDateKey, CloseDateKey, Status, StartDate, EndDate, IsCurrent)
    VALUES (source.AccountID, source.CustomerID, source.ProductID, source.OpenDateKey, source.CloseDateKey, source.Status, source.StartDate, source.EndDate, source.IsCurrent);

-- Mapping Transaction Data to FactTransaction
INSERT INTO CreditDW.dbo.FactTransaction (TransactionID, AccountKey, DateKey, Amount, TransactionType, ProductKey)
SELECT 
    t.TransactionID, 
    da.AccountKey, 
    CONVERT(INT, FORMAT(t.PaymentDate, 'yyyyMMdd')) AS DateKey, 
    t.Amount, 
    osm.OptionSetValue AS TransactionType, 
    dp.ProductKey
FROM CreditLakehouseDB.dbo.Transaction t
JOIN CreditDW.dbo.DimAccount da ON t.AccountID = da.AccountID
JOIN CreditLakehouseDB.dbo.OptionSetMaster osm ON t.TransactionTypeID = osm.OptionSetID
JOIN CreditDW.dbo.DimProduct dp ON dp.ProductID = (SELECT ca.ProductID FROM CreditLakehouseDB.dbo.CreditAccount ca WHERE ca.AccountID = t.AccountID)
WHERE NOT EXISTS (SELECT 1 FROM CreditDW.dbo.FactTransaction ft WHERE ft.TransactionID = t.TransactionID);