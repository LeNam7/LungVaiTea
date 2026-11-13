Add-Type -AssemblyName System.Data
$connStr = 'Server=localhost\SQLEXPRESS;Database=seeme-web;Trusted_Connection=True;TrustServerCertificate=True;'
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "=== 1. Adding multilingual columns to Gardens ==="
$cmd = $conn.CreateCommand()
$cmd.CommandText = @"
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Gardens' AND COLUMN_NAME = 'NameEn')
    ALTER TABLE Gardens ADD NameEn nvarchar(255) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Gardens' AND COLUMN_NAME = 'AddressEn')
    ALTER TABLE Gardens ADD AddressEn nvarchar(500) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Gardens' AND COLUMN_NAME = 'DescriptionEn')
    ALTER TABLE Gardens ADD DescriptionEn nvarchar(MAX) NULL;
"@
$cmd.ExecuteNonQuery()
Write-Host "Gardens columns verified/added."

Write-Host "=== 2. Adding multilingual columns to Teas ==="
$cmd.CommandText = @"
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Teas' AND COLUMN_NAME = 'NameEn')
    ALTER TABLE Teas ADD NameEn nvarchar(255) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Teas' AND COLUMN_NAME = 'DescriptionEn')
    ALTER TABLE Teas ADD DescriptionEn nvarchar(MAX) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Teas' AND COLUMN_NAME = 'TypeEn')
    ALTER TABLE Teas ADD TypeEn nvarchar(255) NULL;
"@
$cmd.ExecuteNonQuery()
Write-Host "Teas columns verified/added."

Write-Host "=== 3. Adding multilingual columns to Products ==="
$cmd.CommandText = @"
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'NameEn')
    ALTER TABLE Products ADD NameEn nvarchar(255) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'DescriptionEn')
    ALTER TABLE Products ADD DescriptionEn nvarchar(MAX) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'PackagingNameEn')
    ALTER TABLE Products ADD PackagingNameEn nvarchar(255) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'VariantNameEn')
    ALTER TABLE Products ADD VariantNameEn nvarchar(255) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'CollectionNameEn')
    ALTER TABLE Products ADD CollectionNameEn nvarchar(255) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'UserManualEn')
    ALTER TABLE Products ADD UserManualEn nvarchar(MAX) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products' AND COLUMN_NAME = 'StorageInstructionsEn')
    ALTER TABLE Products ADD StorageInstructionsEn nvarchar(MAX) NULL;
"@
$cmd.ExecuteNonQuery()
Write-Host "Products columns verified/added."

Write-Host "=== 4. Adding multilingual columns to TeaGroups ==="
$cmd.CommandText = @"
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TeaGroups' AND COLUMN_NAME = 'NameEn')
    ALTER TABLE TeaGroups ADD NameEn nvarchar(255) NULL;
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TeaGroups' AND COLUMN_NAME = 'DescriptionEn')
    ALTER TABLE TeaGroups ADD DescriptionEn nvarchar(MAX) NULL;
"@
$cmd.ExecuteNonQuery()
Write-Host "TeaGroups columns verified/added."

Write-Host "`n=== 5. Updating existing records with English translations ==="
$cmd.CommandText = @"
-- Gardens
UPDATE Gardens SET 
    NameEn = N'Lung Vai Ancient Tea Garden',
    AddressEn = N'Lung Vai Village, Phuong Do Commune, Ha Giang City',
    DescriptionEn = N'Centuries-old ancient Shan Tuyet tea garden situated at an altitude above 1,200m, shrouded in clouds and mist all year round.'
WHERE Id = 1;

UPDATE Gardens SET 
    NameEn = N'Tay Con Linh Cloud Summit Garden',
    AddressEn = N'Tay Con Linh Mountain Range, Phuong Do Commune, Ha Giang City',
    DescriptionEn = N'Heritage tea tree population growing completely wild amidst the primeval virgin forests.'
WHERE Id = 2;

-- Teas
UPDATE Teas SET
    NameEn = N'Ancient Shan Tuyet Tree LVT-001 (Great Sovereign)',
    TypeEn = N'Ancient tree (1 bud 1 leaf)',
    DescriptionEn = N'A grand ancient Shan Tuyet tea tree standing proud atop Mount Lung Vai with over 5 centuries of history. Rich in minerals and natural mountain mist.'
WHERE Id = 1;

UPDATE Teas SET
    NameEn = N'Ancient Shan Tuyet Tree LVT-002 (White Crane Peak)',
    TypeEn = N'Ancient tree (1 bud 2 leaves)',
    DescriptionEn = N'Nestled on the morning sun slope, producing pristine snow-white buds reminiscent of a flying crane. Pure delicate taste and lasting sweetness.'
WHERE Id = 2;

UPDATE Teas SET
    NameEn = N'Ancient Shan Tuyet Tree LVT-003 (Tay Con Linh Cloud Mist)',
    TypeEn = N'Ancient tree (snow bud)',
    DescriptionEn = N'Growing naturally at 1,400m elevation enveloped in sea of clouds. Endowed with pure vital energy of primeval mountains.'
WHERE Id = 3;

-- TeaGroups
UPDATE TeaGroups SET NameEn = N'Green Tea', DescriptionEn = N'Traditional Vietnamese green tea with subtle bitterness and deep, lingering sweet aftertaste.' WHERE Slug = 'luc-tra';
UPDATE TeaGroups SET NameEn = N'Black Tea', DescriptionEn = N'Premium oxidized black tea crafted from ancient Shan Tuyet leaves with honeyed aroma.' WHERE Slug = 'hong-tra';
UPDATE TeaGroups SET NameEn = N'White Tea', DescriptionEn = N'Pure, delicate white tea hand-picked from the finest downy buds of ancient Shan Tuyet trees.' WHERE Slug = 'bach-tra';
UPDATE TeaGroups SET NameEn = N'Raw Pu-erh', DescriptionEn = N'Artisanal wild raw pu-erh cakes, naturally fermenting and gaining depth over time.' WHERE Slug = 'pho-nhi-song';
UPDATE TeaGroups SET NameEn = N'Gift Sets', DescriptionEn = N'Luxurious heritage tea gift collections in handcrafted lacquerware and porcelain boxes.' WHERE Slug = 'set-qua-tang';

-- Products
UPDATE Products SET
    NameEn = N'Lung Vai Ancient Shan Tuyet Green Tea',
    PackagingNameEn = N'Premium Tin Box',
    VariantNameEn = N'100g Tin Box',
    DescriptionEn = N'Handcrafted from 1-bud-2-leaf shoots of 300-year-old ancient tea trees in Lung Vai. Delicate mellow astringency, deep sweet aftertaste, and golden honey liquor.',
    UserManualEn = N'Rinse teapot with boiling water. Use 5g of tea per 150ml of 85-90°C water. Steep for 20-30 seconds, pour out and savor.',
    StorageInstructionsEn = N'Store in a cool, dry place away from direct sunlight and strong odors.'
WHERE Id = 1;

UPDATE Products SET
    NameEn = N'Lung Vai Ancient Shan Tuyet Green Tea',
    PackagingNameEn = N'Lacquer Wood Box',
    VariantNameEn = N'200g Lacquer Box',
    DescriptionEn = N'Premium packaging in traditional Vietnamese lacquer wooden box, ideal for formal gifting.',
    UserManualEn = N'Use 5-8g of tea for 150-200ml of 85°C water. Steep for 25-35 seconds.',
    StorageInstructionsEn = N'Keep wooden lid and zip bag tightly sealed after each use.'
WHERE Id = 2;

UPDATE Products SET
    NameEn = N'Cloud Summit Ancient Shan Tuyet Black Tea',
    PackagingNameEn = N'Bat Trang Ceramic Jar',
    VariantNameEn = N'100g Ceramic Jar',
    DescriptionEn = N'Fully oxidized black tea made from ancient tea shoots. Brilliant amber liquor with notes of ripe fruit and wild honey.',
    UserManualEn = N'Use 5g of tea per 150ml of 95-100°C water. Steep for 30-45 seconds.',
    StorageInstructionsEn = N'Keep inside sealed ceramic jar in a cool, dry place.'
WHERE Id = 3;

UPDATE Products SET
    NameEn = N'Dragon Claw Ancient White Tea',
    PackagingNameEn = N'Gold Gilded Gift Box',
    VariantNameEn = N'75g Box',
    DescriptionEn = N'Rare Dragon Claw white tea harvested above 1,500m on Tay Con Linh mountains. Claw-shaped buds dense with silver downy fur.',
    UserManualEn = N'Use 3-5g of dragon claw buds per 200ml of 85-90°C water. Steep for 1-2 minutes.',
    StorageInstructionsEn = N'Store in a dry place away from direct light.'
WHERE Id = 4;

UPDATE Products SET
    NameEn = N'Silver Needle Ancient White Tea',
    PackagingNameEn = N'Royal Velvet Box',
    VariantNameEn = N'50g Box',
    DescriptionEn = N'The crown jewel of teas, picking only pristine single buds shrouded in white fuzz at dawn. Regal orchid fragrance and refreshing sweetness.',
    UserManualEn = N'Brew in glass cup or pot, 80-85°C water. Steep for 2-3 minutes to watch upright floating buds.',
    StorageInstructionsEn = N'Store airtight in a dry, cool room at stable temperature.'
WHERE Id = 5;

UPDATE Products SET
    NameEn = N'2024 Ancient Shan Tuyet Raw Pu-erh Cake',
    PackagingNameEn = N'Do Paper Wrapped Cake',
    VariantNameEn = N'357g Cake',
    DescriptionEn = N'Traditional 357g compressed raw pu-erh tea cake crafted from 400-year-old tea trees. Rich internal compounds that appreciate in value with age.',
    UserManualEn = N'Use tea knife to separate 6-8g of tea. Flash rinse with 100°C boiling water. Steep for 10-25 seconds.',
    StorageInstructionsEn = N'Store in a well-ventilated, clean, odorless space away from direct sunlight.'
WHERE Id = 6;

UPDATE Products SET
    NameEn = N'Lung Vai Heritage Tea Gift Set - An Loc',
    CollectionNameEn = N'An Loc (Peace & Fortune)',
    PackagingNameEn = N'Handcrafted Lacquer Box',
    VariantNameEn = N'3-Tea Heritage Set',
    DescriptionEn = N'Luxury An Loc gift set featuring 3 prized teas: Ancient Green Tea, Cloud Summit Black Tea, and Dragon Claw White Tea.',
    UserManualEn = N'Detailed tea ceremony guide included inside gift box.',
    StorageInstructionsEn = N'Keep in a dry place; avoid sharp impacts on lacquer surface.'
WHERE Id = 7;

UPDATE Products SET
    NameEn = N'Imperial Five Blessings Luxury Gift Set',
    CollectionNameEn = N'Ngu Phuc (Five Blessings)',
    PackagingNameEn = N'Leather Gift Box with Metal Accents',
    VariantNameEn = N'5 Heritage Teas & Ceramic Cups',
    DescriptionEn = N'Limited edition gift set symbolizing Wealth, Longevity, and Harmony. Contains 5 supreme Shan Tuyet teas with handcrafted cups.',
    UserManualEn = N'Refer to tea handbook included in the set.',
    StorageInstructionsEn = N'Keep dry in sealed box at room temperature.'
WHERE Id = 8;
"@
$cmd.ExecuteNonQuery()
Write-Host "Database migration and translation data applied successfully."

$conn.Close()
