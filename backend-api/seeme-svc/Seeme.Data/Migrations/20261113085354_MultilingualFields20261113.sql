-- Seeme API: MultilingualFields20261113 (chạy tay nếu DB chưa chạy migration EF).
-- Tương đương migration EF cùng tên. Chạy 1 lần trên SQL Server.
-- Bổ sung các trường đa ngôn ngữ (En) cho Tea, TeaGroup, Product, Garden.

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101011044_updatedb_20261101'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261101011044_updatedb_20261101', N'9.0.9');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113085354_MultilingualFields20261113'
)
BEGIN
    ALTER TABLE [Teas] ADD [DescriptionEn] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113085354_MultilingualFields20261113'
)
BEGIN
    ALTER TABLE [Teas] ADD [NameEn] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113085354_MultilingualFields20261113'
)
BEGIN
    ALTER TABLE [Teas] ADD [TypeEn] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113085354_MultilingualFields20261113'
)
BEGIN
    ALTER TABLE [TeaGroups] ADD [DescriptionEn] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113085354_MultilingualFields20261113'
)
BEGIN
    ALTER TABLE [TeaGroups] ADD [NameEn] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113085354_MultilingualFields20261113'
)
BEGIN
    ALTER TABLE [Products] ADD [CollectionNameEn] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113085354_MultilingualFields20261113'
)
BEGIN
    ALTER TABLE [Products] ADD [DescriptionEn] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113085354_MultilingualFields20261113'
)
BEGIN
    ALTER TABLE [Products] ADD [NameEn] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113085354_MultilingualFields20261113'
)
BEGIN
    ALTER TABLE [Products] ADD [PackagingNameEn] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113085354_MultilingualFields20261113'
)
BEGIN
    ALTER TABLE [Products] ADD [StorageInstructionsEn] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113085354_MultilingualFields20261113'
)
BEGIN
    ALTER TABLE [Products] ADD [UserManualEn] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113085354_MultilingualFields20261113'
)
BEGIN
    ALTER TABLE [Products] ADD [VariantNameEn] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113085354_MultilingualFields20261113'
)
BEGIN
    ALTER TABLE [Gardens] ADD [AddressEn] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113085354_MultilingualFields20261113'
)
BEGIN
    ALTER TABLE [Gardens] ADD [DescriptionEn] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113085354_MultilingualFields20261113'
)
BEGIN
    ALTER TABLE [Gardens] ADD [NameEn] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113085354_MultilingualFields20261113'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261113085354_MultilingualFields20261113', N'9.0.9');
END;

COMMIT;
GO
