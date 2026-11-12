-- Seeme API: ProductGroupId20261101 (chạy tay nếu DB chưa chạy migration EF).
-- Tương đương migration EF cùng tên. Chạy 1 lần trên SQL Server.
-- Tái cấu trúc 1/11/2026 (Nhóm trà → Sản phẩm): sản phẩm trỏ thẳng tới nhóm trà qua GroupId.
ALTER TABLE Products ADD GroupId nvarchar(max) NULL;
-- Điền nhóm cho dữ liệu cũ từ slug nhóm của danh mục mà sản phẩm đang trỏ tới.
UPDATE p SET p.GroupId = c.[Group] FROM Products p INNER JOIN CategoryTeas c ON c.Id = p.CategoryId WHERE c.[Group] IS NOT NULL AND c.[Group] <> '';
-- Set quà luôn thuộc nhóm quà, kể cả khi danh mục của nó lệch.
UPDATE Products SET GroupId = 'set-qua-tang' WHERE IsGiftSet = 1;
