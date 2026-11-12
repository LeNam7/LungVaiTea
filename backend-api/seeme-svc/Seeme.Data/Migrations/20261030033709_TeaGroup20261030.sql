-- Seeme API: TeaGroup20261030 (chạy tay nếu DB chưa chạy migration EF).
-- Tương đương migration EF cùng tên (20261030033709_TeaGroup20261030). Chạy 1 lần trên SQL Server.
-- Cuối script có ghi dòng vào __EFMigrationsHistory để lần chạy `dotnet ef database update` sau đó không chạy lại migration này.
-- 1) Tạo bảng nhóm trà
CREATE TABLE TeaGroups (
    Id int IDENTITY(1,1) NOT NULL,
    Slug nvarchar(100) NOT NULL,
    Name nvarchar(max) NOT NULL,
    Description nvarchar(max) NULL,
    ImageUrl nvarchar(max) NULL,
    SortOrder int NOT NULL,
    IsActive bit NOT NULL,
    CreatedDate datetime2 NULL,
    UpdatedDate datetime2 NULL,
    IsDelete bit NOT NULL,
    CONSTRAINT PK_TeaGroups PRIMARY KEY CLUSTERED (Id ASC)
);
CREATE UNIQUE INDEX IX_TeaGroups_Slug ON TeaGroups (Slug);
-- 2) Thêm cột ảnh đại diện danh mục
ALTER TABLE CategoryTeas ADD ImageUrl nvarchar(max) NULL;
-- 3) Seed 5 nhóm trà hiện tại (khớp CategoryTea.Group đang dùng ở FE, chỉ thêm khi chưa có)
IF NOT EXISTS (SELECT 1 FROM TeaGroups WHERE Slug = 'luc-tra') INSERT INTO TeaGroups (Slug, Name, Description, SortOrder, IsActive, CreatedDate, IsDelete) VALUES ('luc-tra', N'Lục trà', N'Là phẩm trà quen thuộc của người dân Việt Nam ta, ưa vị đắng, chát và ngọt hậu. Có thể được làm từ búp chè 1 tôm 1 lá, hoặc 1 tôm 2 lá, định dạng theo nhiều hình dáng khác nhau: xoăn, móc câu, hoặc để thẳng như hình dáng ban đầu. Cách chế biến khá cầu kỳ tạo hương tạo vị đặc trưng cho trà xanh.', 0, 1, GETDATE(), 0);
IF NOT EXISTS (SELECT 1 FROM TeaGroups WHERE Slug = 'hong-tra') INSERT INTO TeaGroups (Slug, Name, Description, SortOrder, IsActive, CreatedDate, IsDelete) VALUES ('hong-tra', N'Hồng trà', N'Dòng hồng trà cao cấp được làm từ những búp trà Shan Tuyết cổ thụ lâu năm. Vị trà đậm, hậu ngọt sâu, màu nước ánh hồng đặc trưng.', 1, 1, GETDATE(), 0);
IF NOT EXISTS (SELECT 1 FROM TeaGroups WHERE Slug = 'bach-tra') INSERT INTO TeaGroups (Slug, Name, Description, SortOrder, IsActive, CreatedDate, IsDelete) VALUES ('bach-tra', N'Bạch Trà', N'Dòng bạch trà nhẹ nhàng, thanh khiết, được làm từ những búp trà non tuyển chọn của cây trà Shan Tuyết cổ thụ.', 2, 1, GETDATE(), 0);
IF NOT EXISTS (SELECT 1 FROM TeaGroups WHERE Slug = 'pho-nhi-song') INSERT INTO TeaGroups (Slug, Name, Description, SortOrder, IsActive, CreatedDate, IsDelete) VALUES ('pho-nhi-song', N'Phổ Nhĩ Sống', N'Dòng trà Phổ Nhĩ sống, càng để lâu càng lên hương. Hiện chưa có sản phẩm nào trên hệ thống, sẽ cập nhật khi có hàng.', 3, 1, GETDATE(), 0);
IF NOT EXISTS (SELECT 1 FROM TeaGroups WHERE Slug = 'set-qua-tang') INSERT INTO TeaGroups (Slug, Name, Description, SortOrder, IsActive, CreatedDate, IsDelete) VALUES ('set-qua-tang', N'Set quà tặng', N'Các bộ sưu tập quà tặng trà, đóng gói theo set với nhiều lựa chọn quy cách và màu sắc.', 4, 1, GETDATE(), 0);
-- 4) Ghi nhận migration đã áp dụng để EF không chạy lại
IF NOT EXISTS (SELECT 1 FROM __EFMigrationsHistory WHERE MigrationId = '20261030033709_TeaGroup20261030') INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20261030033709_TeaGroup20261030', '9.0.9');
