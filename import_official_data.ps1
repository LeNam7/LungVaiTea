# ========================================================
# Script Import Data Chinh Thuc Tu seeme-data.sql
# ========================================================
param(
    [string]$ServerInstance = "localhost\SQLEXPRESS",
    [string]$Database = "seeme-web"
)

Write-Host "=== 1. Xoa du lieu cu / demo ===" -ForegroundColor Cyan
$clearSql = @"
USE [$Database];
DELETE FROM [UserTrackings];
DELETE FROM [UserAddress];
DELETE FROM [RefreshTokens];
DELETE FROM [PasswordResetTokens];
DELETE FROM [OrderProducts];
DELETE FROM [OrderTeas];
DELETE FROM [Orders];
DELETE FROM [PlantProgress];
DELETE FROM [Teas];
DELETE FROM [Products];
DELETE FROM [CategoryTeas];
DELETE FROM [TeaGroups];
DELETE FROM [Gardens];
DELETE FROM [Blogs];
DELETE FROM [Contacts];
DELETE FROM [Users];
DELETE FROM [__EFMigrationsHistory];
"@

$connStr = "Server=$ServerInstance;Database=$Database;Trusted_Connection=True;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = $clearSql
$cmd.ExecuteNonQuery()
Write-Host "Da don dep toan bo bang du lieu cu." -ForegroundColor Green

Write-Host "`n=== 2. Import seeme-data.sql bang sqlcmd ===" -ForegroundColor Cyan
$sqlFile = Join-Path $PSScriptRoot "seeme-data.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Error "Khong tim thay file seeme-data.sql tai: $sqlFile"
    $conn.Close()
    exit 1
}

$proc = Start-Process -FilePath "sqlcmd" -ArgumentList "-S `"$ServerInstance`" -E -d `"$Database`" -b -i `"$sqlFile`"" -Wait -NoNewWindow -PassThru
if ($proc.ExitCode -ne 0) {
    Write-Error "Loi trong qua trinh import sqlcmd (ExitCode: $($proc.ExitCode))"
    $conn.Close()
    exit $proc.ExitCode
}
Write-Host "Import seeme-data.sql thanh cong!" -ForegroundColor Green

Write-Host "`n=== 3. Dong bo Migration Da ngon ngu va Cap nhat Ban dich ===" -ForegroundColor Cyan
$updateSql = @"
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE MigrationId = '20261113085354_MultilingualFields20261113')
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES ('20261113085354_MultilingualFields20261113', '9.0.9');
END

-- TeaGroups
UPDATE TeaGroups SET NameEn = N'Green Tea', DescriptionEn = N'Traditional Vietnamese green tea with subtle bitterness and deep, lingering sweet aftertaste.' WHERE Slug = 'luc-tra';
UPDATE TeaGroups SET NameEn = N'Black Tea', DescriptionEn = N'Premium oxidized black tea crafted from ancient Shan Tuyet leaves with honeyed aroma.' WHERE Slug = 'hong-tra';
UPDATE TeaGroups SET NameEn = N'White Tea', DescriptionEn = N'Pure, delicate white tea hand-picked from the finest downy buds of ancient Shan Tuyet trees.' WHERE Slug = 'bach-tra';
UPDATE TeaGroups SET NameEn = N'Raw Pu-erh', DescriptionEn = N'Artisanal wild raw pu-erh cakes, naturally fermenting and gaining depth over time.' WHERE Slug = 'pho-nhi-song';
UPDATE TeaGroups SET NameEn = N'Gift Sets', DescriptionEn = N'Luxurious heritage tea gift collections in handcrafted lacquerware and porcelain boxes.' WHERE Slug = 'set-qua-tang';

-- Gardens
UPDATE Gardens SET NameEn = N'Nhiem Garden', AddressEn = N'Lung Vai - Ha Thanh, Ha Giang, Vietnam', DescriptionEn = N'Nhiem ancient tea garden at Lung Vai - Ha Thanh.' WHERE Id = 1;
UPDATE Gardens SET NameEn = N'Chui Garden', AddressEn = N'Lung Vai - Ha Thanh, Ha Giang, Vietnam', DescriptionEn = N'Chui ancient tea garden at Lung Vai - Ha Thanh.' WHERE Id = 2;
UPDATE Gardens SET NameEn = N'Peng Garden', AddressEn = N'Lung Vai - Ha Thanh, Ha Giang, Vietnam', DescriptionEn = N'Peng ancient tea garden at Lung Vai - Ha Thanh.' WHERE Id = 3;
UPDATE Gardens SET NameEn = N'Hau Garden', AddressEn = N'Lung Vai - Ha Thanh, Ha Giang, Vietnam', DescriptionEn = N'Hau ancient tea garden at Lung Vai - Ha Thanh.' WHERE Id = 4;
UPDATE Gardens SET NameEn = N'Sui Garden', AddressEn = N'Lung Vai - Ha Thanh, Ha Giang, Vietnam', DescriptionEn = N'Sui ancient tea garden at Lung Vai - Ha Thanh.' WHERE Id = 5;
UPDATE Gardens SET NameEn = N'Bang Garden', AddressEn = N'Lung Vai - Ha Thanh, Ha Giang, Vietnam', DescriptionEn = N'Bang ancient tea garden at Lung Vai - Ha Thanh.' WHERE Id = 6;
UPDATE Gardens SET NameEn = N'Chap Garden', AddressEn = N'Lung Vai - Ha Thanh, Ha Giang, Vietnam', DescriptionEn = N'Chap ancient tea garden at Lung Vai - Ha Thanh.' WHERE Id = 7;
UPDATE Gardens SET NameEn = N'Hec Garden', AddressEn = N'Lung Vai - Ha Thanh, Ha Giang, Vietnam', DescriptionEn = N'Hec ancient tea garden at Lung Vai - Ha Thanh.' WHERE Id = 8;
UPDATE Gardens SET NameEn = N'Zone 01', AddressEn = N'Lung Vai - Ha Thanh, Ha Giang, Vietnam', DescriptionEn = N'Zone 01 tea garden at Lung Vai - Ha Thanh.' WHERE Id = 11;
UPDATE Gardens SET NameEn = N'Zone 02', AddressEn = N'Lung Vai - Ha Thanh, Ha Giang, Vietnam', DescriptionEn = N'Zone 02 tea garden at Lung Vai - Ha Thanh.' WHERE Id = 12;
UPDATE Gardens SET NameEn = N'Zone 03', AddressEn = N'Lung Vai - Ha Thanh, Ha Giang, Vietnam', DescriptionEn = N'Zone 03 tea garden at Lung Vai - Ha Thanh.' WHERE Id = 13;
"@

$cmd.CommandText = $updateSql
$cmd.ExecuteNonQuery()
Write-Host "Dong bo da ngon ngu hoan tat!" -ForegroundColor Green

Write-Host "`n=== 4. Thong ke so luong ban ghi thuc te ===" -ForegroundColor Cyan
$tables = @('Products', 'Teas', 'Gardens', 'CategoryTeas', 'TeaGroups', 'Blogs', 'Orders', 'OrderProducts', 'OrderTeas', 'Users')
foreach ($t in $tables) {
    $cmd.CommandText = "SELECT COUNT(*) FROM [$t]"
    $cnt = $cmd.ExecuteScalar()
    Write-Host ("  {0,-15} : {1} rows" -f $t, $cnt)
}
$conn.Close()

Write-Host "`n[HOAN TAT] He thong da san sang voi du lieu chinh thuc tu seeme-data.sql!" -ForegroundColor Green
