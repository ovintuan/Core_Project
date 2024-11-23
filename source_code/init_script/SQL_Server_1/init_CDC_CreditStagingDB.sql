-- Bật CDC trên database
USE CreditStagingDB;
GO
sp_configure 'show advanced options', 1;
RECONFIGURE;
GO
sp_configure 'clr enabled', 1;
RECONFIGURE;
GO

EXEC xp_servicecontrol 'START', 'SQLServerAgent';

EXEC sys.sp_cdc_enable_db;

ALTER DATABASE CreditStagingDB SET CHANGE_TRACKING = ON (CHANGE_RETENTION = 2 DAYS, AUTO_CLEANUP = ON);

-- Bật CDC trên bảng
EXEC sys.sp_cdc_enable_table
  @source_schema = 'dbo',
  @source_name = 'CustomerProductAccount',
  @role_name = NULL;

EXEC sys.sp_cdc_enable_table
  @source_schema = 'dbo',
  @source_name = 'AccountTransactionHistory',
  @role_name = NULL;