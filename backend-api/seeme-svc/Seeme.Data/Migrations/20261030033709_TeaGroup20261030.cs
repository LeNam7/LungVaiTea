using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Seeme.Data.Migrations
{
    /// <inheritdoc />
    public partial class TeaGroup20261030 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TeaGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Slug = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeaGroups", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TeaGroups_Slug",
                table: "TeaGroups",
                column: "Slug",
                unique: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "CategoryTeas",
                type: "nvarchar(max)",
                nullable: true);

            // Dữ liệu khởi tạo: 5 nhóm trà hiện tại (khớp CategoryTea.Group đang dùng ở FE,
            // mô tả lấy từ design 10/2026). IF NOT EXISTS để chạy lại an toàn nếu bảng đã có dữ liệu.
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM TeaGroups WHERE Slug = 'luc-tra') INSERT INTO TeaGroups (Slug, Name, Description, SortOrder, IsActive, CreatedDate, IsDelete) VALUES ('luc-tra', N'Lục trà', N'Là phẩm trà quen thuộc của người dân Việt Nam ta, ưa vị đắng, chát và ngọt hậu. Có thể được làm từ búp chè 1 tôm 1 lá, hoặc 1 tôm 2 lá, định dạng theo nhiều hình dáng khác nhau: xoăn, móc câu, hoặc để thẳng như hình dáng ban đầu. Cách chế biến khá cầu kỳ tạo hương tạo vị đặc trưng cho trà xanh.', 0, 1, GETDATE(), 0)");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM TeaGroups WHERE Slug = 'hong-tra') INSERT INTO TeaGroups (Slug, Name, Description, SortOrder, IsActive, CreatedDate, IsDelete) VALUES ('hong-tra', N'Hồng trà', N'Dòng hồng trà cao cấp được làm từ những búp trà Shan Tuyết cổ thụ lâu năm. Vị trà đậm, hậu ngọt sâu, màu nước ánh hồng đặc trưng.', 1, 1, GETDATE(), 0)");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM TeaGroups WHERE Slug = 'bach-tra') INSERT INTO TeaGroups (Slug, Name, Description, SortOrder, IsActive, CreatedDate, IsDelete) VALUES ('bach-tra', N'Bạch Trà', N'Dòng bạch trà nhẹ nhàng, thanh khiết, được làm từ những búp trà non tuyển chọn của cây trà Shan Tuyết cổ thụ.', 2, 1, GETDATE(), 0)");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM TeaGroups WHERE Slug = 'pho-nhi-song') INSERT INTO TeaGroups (Slug, Name, Description, SortOrder, IsActive, CreatedDate, IsDelete) VALUES ('pho-nhi-song', N'Phổ Nhĩ Sống', N'Dòng trà Phổ Nhĩ sống, càng để lâu càng lên hương. Hiện chưa có sản phẩm nào trên hệ thống, sẽ cập nhật khi có hàng.', 3, 1, GETDATE(), 0)");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM TeaGroups WHERE Slug = 'set-qua-tang') INSERT INTO TeaGroups (Slug, Name, Description, SortOrder, IsActive, CreatedDate, IsDelete) VALUES ('set-qua-tang', N'Set quà tặng', N'Các bộ sưu tập quà tặng trà, đóng gói theo set với nhiều lựa chọn quy cách và màu sắc.', 4, 1, GETDATE(), 0)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TeaGroups");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "CategoryTeas");
        }
    }
}
