Add-Type -AssemblyName System.Data
$connStr = 'Server=localhost\SQLEXPRESS;Database=seeme-web;Trusted_Connection=True;TrustServerCertificate=True;'
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "=== 1. Checking & Inserting Gardens ==="
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT COUNT(*) FROM Gardens WHERE IsDelete = 0"
$gardenCount = [int]$cmd.ExecuteScalar()
if ($gardenCount -eq 0) {
    Write-Host "Inserting 2 demo Gardens..."
    $cmd.CommandText = @"
    SET IDENTITY_INSERT Gardens ON;
    INSERT INTO Gardens (Id, Name, Address, Description, IsActive, IsDelete, CreatedDate, UpdatedDate)
    VALUES 
    (1, N'Vườn Trà Cổ Thụ Lùng Vài', N'Thôn Lùng Vài, Xã Phương Độ, TP. Hà Giang', N'Vườn trà Shan Tuyết cổ thụ hàng trăm năm tuổi nằm ở độ cao trên 1200m quanh năm sương mây bao phủ.', 1, 0, GETDATE(), GETDATE()),
    (2, N'Vườn Trà Đỉnh Mây Tây Côn Lĩnh', N'Dãy Tây Côn Lĩnh, Xã Phương Độ, TP. Hà Giang', N'Quần thể cây trà di sản sinh trưởng hoàn toàn tự nhiên giữa rừng nguyên sinh đại ngàn.', 1, 0, GETDATE(), GETDATE());
    SET IDENTITY_INSERT Gardens OFF;
"@
    $cmd.ExecuteNonQuery()
    Write-Host "Gardens inserted successfully."
} else {
    Write-Host "Gardens already exist ($gardenCount rows)."
}

Write-Host "`n=== 2. Checking & Inserting CategoryTeas ==="
$cmd.CommandText = "SELECT COUNT(*) FROM CategoryTeas WHERE IsDelete = 0"
$catCount = [int]$cmd.ExecuteScalar()
if ($catCount -eq 0) {
    Write-Host "Inserting 2 demo CategoryTeas..."
    $cmd.CommandText = @"
    SET IDENTITY_INSERT CategoryTeas ON;
    INSERT INTO CategoryTeas (Id, Name, Description, [Group], ImageUrl, IsActive, IsDelete, CreatedDate, UpdatedDate)
    VALUES 
    (1, N'Trà Shan Tuyết Cổ Thụ', N'Trà búp Shan Tuyết thu hái từ cây chè cổ thụ Lùng Vài', N'luc-tra', N'/images/bosuutaptraimg.png', 1, 0, GETDATE(), GETDATE()),
    (2, N'Bạch Trà & Phổ Nhĩ Di Sản', N'Bạch trà quý hiếm và trà Phổ Nhĩ lên men tự nhiên', N'bach-tra', N'/images/sptrathuonghang.png', 1, 0, GETDATE(), GETDATE());
    SET IDENTITY_INSERT CategoryTeas OFF;
"@
    $cmd.ExecuteNonQuery()
    Write-Host "CategoryTeas inserted successfully."
} else {
    Write-Host "CategoryTeas already exist ($catCount rows)."
}

Write-Host "`n=== 3. Checking & Inserting Products ==="
$cmd.CommandText = "SELECT COUNT(*) FROM Products WHERE IsDelete = 0"
$productCount = [int]$cmd.ExecuteScalar()
if ($productCount -eq 0) {
    Write-Host "Inserting demo Products..."
    $cmd.CommandText = @"
    INSERT INTO Products (
        Name, CategoryId, GroupId, Price, Total, Quantity, PackagingName, VariantName, 
        IsGiftSet, CollectionName, ColorOptions, Description, UserManual, StorageInstructions, 
        Images, IsActive, IsDelete, CreatedDate, UpdatedDate
    )
    VALUES 
    (
        N'Lục Trà Shan Tuyết Cổ Thụ Lùng Vài', 1, N'luc-tra', 350000, 50, 100, N'Hộp thiếc cao cấp', N'Hộp 100g',
        0, N'', N'',
        N'Lục trà Shan Tuyết được tuyển chọn từ những búp chè 1 tôm 2 lá của cây trà cổ thụ trên 300 năm tuổi tại Lùng Vài, Hà Giang. Vị chát êm dịu, ngọt hậu sâu lắng, nước trà vàng óng ánh mật ong.',
        N'Tráng ấm bằng nước sôi. Dùng 5g trà cho 150ml nước sôi 85-90°C. Hãm trà từ 20-30 giây rồi rót ra chuyên và thưởng thức.',
        N'Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp và mùi lạ.',
        N'/images/sptrathuonghang.png', 1, 0, GETDATE(), GETDATE()
    ),
    (
        N'Lục Trà Shan Tuyết Cổ Thụ Lùng Vài', 1, N'luc-tra', 680000, 35, 200, N'Hộp gỗ sơn mài', N'Hộp 200g',
        0, N'', N'',
        N'Quy cách đóng gói cao cấp trong hộp gỗ sơn mài truyền thống, thích hợp làm quà biếu trang trọng. Búp trà Shan Tuyết cổ thụ 1 tôm 2 lá hảo hạng.',
        N'Dùng 5-8g trà cho 150-200ml nước nhiệt độ 85°C. Hãm từ 25-35 giây.',
        N'Đậy kín nắp hộp gỗ và túi zip sau khi sử dụng. Tránh nơi ẩm ướt.',
        N'/images/product-clean.png', 1, 0, GETDATE(), GETDATE()
    ),
    (
        N'Hồng Trà Shan Tuyết Cổ Thụ Đỉnh Mây', 1, N'hong-tra', 420000, 40, 100, N'Hũ gốm Bát Tràng', N'Hũ gốm 100g',
        0, N'', N'',
        N'Hồng trà lên men toàn phần từ búp trà Shan Tuyết cổ thụ. Nước trà màu đỏ hổ phách trong vắt, hương thơm hoa quả chín tự nhiên kết hợp mật ong rừng ngọt ngào.',
        N'Dùng 5g trà cho 150ml nước sôi 95-100°C. Hãm từ 30-45 giây.',
        N'Bảo quản trong hũ gốm kín, để nơi khô ráo, thoáng mát.',
        N'/images/product.png', 1, 0, GETDATE(), GETDATE()
    ),
    (
        N'Bạch Trà Móng Rồng Cổ Thụ', 2, N'bach-tra', 650000, 30, 75, N'Hộp quà mạ vàng', N'Hộp 75g',
        0, N'', N'',
        N'Bạch trà Móng Rồng thu hái từ những cây chè hoang dã trên dãy Tây Côn Lĩnh ở độ cao trên 1500m. Búp trà có hình dáng tựa như móng vuốt rồng, phủ lớp lông tơ bạc dày đặc, vị thanh mát như suối đầu nguồn.',
        N'Dùng 3-5g búp móng rồng cho 200ml nước nhiệt độ 85-90°C. Hãm từ 1-2 phút.',
        N'Bảo quản nơi khô ráo, tránh ánh sáng trực tiếp.',
        N'/images/bosuutaptraimg.png', 1, 0, GETDATE(), GETDATE()
    ),
    (
        N'Bạch Hào Ngân Châm Cổ Thụ', 2, N'bach-tra', 850000, 25, 50, N'Hộp nhung hoàng gia', N'Hộp 50g',
        0, N'', N'',
        N'Được mệnh danh là Chúa tể các loại trà, chỉ thu hái búp đơn nguyên vẹn phủ tuyết trắng mịn vào buổi sáng sớm còn đọng sương mai. Hương thơm hoa lan rừng quý phái, vị ngọt dịu thanh tao.',
        N'Pha bằng ly hoặc ấm thuỷ tinh, nước 80-85°C. Hãm 2-3 phút để ngắm nhìn từng búp trà đứng thẳng trong nước.',
        N'Bảo quản kín khí, nơi khô mát, nhiệt độ phòng ổn định.',
        N'/images/sptrathuonghang.png', 1, 0, GETDATE(), GETDATE()
    ),
    (
        N'Bánh Trà Phổ Nhĩ Sống Cổ Thụ 2024', 2, N'pho-nhi-song', 1250000, 20, 357, N'Bánh bọc giấy dó', N'Bánh 357g',
        0, N'', N'',
        N'Trà Phổ Nhĩ sống ép bánh truyền thống trọng lượng tiêu chuẩn 357g, nguyên liệu từ cây chè Shan Tuyết cổ thụ 400 năm tuổi. Nội chất cực kỳ phong phú, càng lưu trữ lâu hương vị càng đượm nồng và giá trị càng tăng cao.',
        N'Dùng dao tách trà chuyên dụng tách 6-8g trà cho ấm tử sa. Tráng trà nhanh qua nước sôi 100°C. Hãm các tuần nước từ 10-25 giây.',
        N'Lưu trữ nơi thông thoáng, sạch sẽ, không mùi, độ ẩm tự nhiên, tránh ánh nắng mặt trời.',
        N'/images/imgdemo.png', 1, 0, GETDATE(), GETDATE()
    ),
    (
        N'Set Quà Di Sản Lùng Vài Trà - An Lộc', 1, N'set-qua-tang', 1850000, 20, 300, N'Hộp sơn mài thủ công', N'Set 3 Phẩm Trà',
        1, N'An Lộc', N'Đỏ Ruby:#C2185B;Xanh Cẩm Thạch:#00796B;Vàng Hoàng Gia:#FBC02D',
        N'Bộ quà tặng cao cấp An Lộc kết tinh 3 phẩm trà quý: Lục Trà Cổ Thụ, Hồng Trà Đỉnh Mây và Bạch Trà Móng Rồng. Đi kèm dụng cụ pha trà gỗ mun tinh xảo, là món quà tri ân thượng hạng dành cho đối tác và người trân quý.',
        N'Có sổ tay hướng dẫn thưởng trà chi tiết đính kèm trong hộp quà.',
        N'Bảo quản ở nơi khô ráo, tránh va đập mạnh làm xước bề mặt sơn mài.',
        N'/images/product-clean.png', 1, 0, GETDATE(), GETDATE()
    ),
    (
        N'Set Quà Hoàng Kim Ngũ Phúc', 1, N'set-qua-tang', 2600000, 15, 500, N'Hộp da cao cấp viền kim loại', N'Set 5 Phẩm Trà & Bộ Tách Gốm',
        1, N'Ngũ Phúc', N'Xanh lục bảo:#1B5E20;Nâu hổ phách:#4E342E',
        N'Phiên bản giới hạn Hoàng Kim Ngũ Phúc tượng trưng cho Phú - Quý - Thọ - Khang - Ninh. Bao gồm 5 dòng trà Shan Tuyết cổ thụ quý hiếm bậc nhất cùng bộ đôi chén gốm Lùng Vài chế tác thủ công.',
        N'Xem cẩm nang trà đạo kèm theo trong set quà.',
        N'Tránh ẩm, bảo quản trong hộp kín ở nhiệt độ phòng.',
        N'/images/product.png', 1, 0, GETDATE(), GETDATE()
    );
"@
    $cmd.ExecuteNonQuery()
    Write-Host "Products inserted successfully."
} else {
    Write-Host "Products already exist ($productCount rows)."
}

Write-Host "`n=== 4. Checking & Inserting Teas (Ancient Tea Trees) ==="
$cmd.CommandText = "SELECT COUNT(*) FROM Teas WHERE IsDelete = 0"
$teaCount = [int]$cmd.ExecuteScalar()
if ($teaCount -eq 0) {
    Write-Host "Inserting demo Teas..."
    $cmd.CommandText = @"
    INSERT INTO Teas (
        Name, CategoryIds, Price, GardenId, YearOld, Description,
        Long, Lat, Aspect, IsActive, PackageId, Sold, Owner,
        Images, [Type], Volume, IsDelete, CreatedDate, UpdatedDate
    )
    VALUES 
    (
        N'Cây Shan Tuyết Cổ Thụ LVT-001 (Đại Thụ Vương)', N'1', 35000000, 1, 500,
        N'Cây chè Shan Tuyết cổ thụ sừng sững trên đỉnh núi Lùng Vài với tuổi đời trên 5 thế kỷ. Thân cây phủ rêu phong cổ kính, tán rộng che rợp một vùng. Búp chè dày, mập mạp và giàu khoáng chất.',
        104.9782, 22.8256, N'Đông Nam', 1, 1, 0, 0,
        N'/images/shan-tuyet-tea-tree.jpg', N'Cây cổ thụ 1 tôm 1 lá', 15.5, 0, GETDATE(), GETDATE()
    ),
    (
        N'Cây Shan Tuyết Cổ Thụ LVT-002 (Bạch Hạc Đỉnh)', N'1', 25000000, 1, 380,
        N'Toạ lạc tại sườn núi đón nắng sớm, cây chè Bạch Hạc Đỉnh cho phẩm búp trắng muốt như cánh chim hạc. Hương vị thanh tao, hậu ngọt kéo dài bất tận.',
        104.9795, 22.8268, N'Đông Bắc', 1, 1, 0, 0,
        N'/images/bosuutaptraimg.png', N'Cây cổ thụ 1 tôm 2 lá', 12.0, 0, GETDATE(), GETDATE()
    ),
    (
        N'Cây Shan Tuyết Cổ Thụ LVT-003 (Mây Ngàn Tây Côn Lĩnh)', N'2', 18000000, 2, 280,
        N'Sinh trưởng tự nhiên ở độ cao 1400m quanh năm ngập tràn sương khói mây ngàn. Nguồn sinh khí dồi dào của đất trời mang đến phẩm trà mang phong vị rừng già tinh khiết.',
        104.9820, 22.8310, N'Tây Nam', 1, 1, 0, 0,
        N'/images/thamvuontra.png', N'Cây cổ thụ búp tuyết', 10.5, 0, GETDATE(), GETDATE()
    );
"@
    $cmd.ExecuteNonQuery()
    Write-Host "Teas inserted successfully."
} else {
    Write-Host "Teas already exist ($teaCount rows)."
}

$conn.Close()
Write-Host "`nAll demo data processed."
