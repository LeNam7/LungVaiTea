-- Seeme API: TeaProductCatalog20261025 (chạy tay nếu DB chưa chạy migration EF).
-- Tương đương migration EF cùng tên. Chạy 1 lần trên SQL Server.
-- 1) Thêm cột
ALTER TABLE Products ADD CollectionName nvarchar(max) NOT NULL DEFAULT '';
ALTER TABLE Products ADD ColorOptions nvarchar(max) NOT NULL DEFAULT '';
ALTER TABLE Products ADD IsGiftSet bit NOT NULL DEFAULT 0;
ALTER TABLE Products ADD PackagingName nvarchar(max) NOT NULL DEFAULT '';
ALTER TABLE Products ADD VariantName nvarchar(max) NOT NULL DEFAULT '';
ALTER TABLE Gardens ADD Description nvarchar(max) NOT NULL DEFAULT '';
ALTER TABLE CategoryTeas ADD Description nvarchar(max) NOT NULL DEFAULT '';
ALTER TABLE CategoryTeas ADD [Group] nvarchar(max) NOT NULL DEFAULT '';
-- 2) Dữ liệu khởi tạo (giống migration EF)
UPDATE Products SET PackagingName = N'Hộp' WHERE PackagingName = '';
UPDATE CategoryTeas SET [Group] = 'luc-tra', Description = N'Là phẩm trà quen thuộc của người dân Việt Nam ta, ưa vị đắng, chát và ngọt hậu.' WHERE Name IN (N'Thanh Sơn Trà', N'Vân Lĩnh Trà');
UPDATE CategoryTeas SET [Group] = 'hong-tra', Description = N'Dòng hồng trà cao cấp được làm từ những búp trà Shan Tuyết cổ thụ lâu năm. Vị trà đậm, hậu ngọt sâu, màu nước ánh hồng đặc trưng.' WHERE Name IN (N'Xích Vân Trà', N'Hồng Vân Tiên');
UPDATE CategoryTeas SET [Group] = 'bach-tra', Description = N'Dòng bạch trà nhẹ nhàng, thanh khiết, được làm từ những búp trà non tuyển chọn của cây trà Shan Tuyết cổ thụ.' WHERE Name IN (N'Bạch Vân Tiên', N'Bạch Mẫu Đơn', N'Bạch Huyền Trà');
