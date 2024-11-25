IF EXISTS (SELECT * FROM sys.databases WHERE name = 'CreditLakehouseDB') DROP DATABASE CreditLakehouseDB;
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'CreditDW') DROP DATABASE CreditDW;