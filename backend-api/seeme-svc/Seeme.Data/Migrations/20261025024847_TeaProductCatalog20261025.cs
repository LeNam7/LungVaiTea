using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Seeme.Data.Migrations
{
    /// <inheritdoc />
    public partial class TeaProductCatalog20261025 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CollectionName",
                table: "Products",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ColorOptions",
                table: "Products",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsGiftSet",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PackagingName",
                table: "Products",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "VariantName",
                table: "Products",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Gardens",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "CategoryTeas",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Group",
                table: "CategoryTeas",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            // Dữ liệu khởi tạo: tên bao bì mặc định cho sản phẩm cũ + nhóm trà
            // cho 7 danh mục hiện có (khớp id nhóm ở FE, mô tả lấy từ design 10/2026).
            migrationBuilder.Sql("UPDATE Products SET PackagingName = N'Hộp' WHERE PackagingName = ''");
            migrationBuilder.Sql("UPDATE CategoryTeas SET [Group] = 'luc-tra', Description = N'Là phẩm trà quen thuộc của người dân Việt Nam ta, ưa vị đắng, chát và ngọt hậu. Có thể được làm từ búp chè 1 tôm 1 lá, hoặc 1 tôm 2 lá, định dạng theo nhiều hình dáng khác nhau: xoăn, móc câu, hoặc để thẳng như hình dáng ban đầu. Cách chế biến khá cầu kỳ tạo hương tạo vị đặc trưng cho trà xanh.' WHERE Name IN (N'Thanh Sơn Trà', N'Vân Lĩnh Trà')");
            migrationBuilder.Sql("UPDATE CategoryTeas SET [Group] = 'hong-tra', Description = N'Dòng hồng trà cao cấp được làm từ những búp trà Shan Tuyết cổ thụ lâu năm. Vị trà đậm, hậu ngọt sâu, màu nước ánh hồng đặc trưng.' WHERE Name IN (N'Xích Vân Trà', N'Hồng Vân Tiên')");
            migrationBuilder.Sql("UPDATE CategoryTeas SET [Group] = 'bach-tra', Description = N'Dòng bạch trà nhẹ nhàng, thanh khiết, được làm từ những búp trà non tuyển chọn của cây trà Shan Tuyết cổ thụ.' WHERE Name IN (N'Bạch Vân Tiên', N'Bạch Mẫu Đơn', N'Bạch Huyền Trà')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CollectionName",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ColorOptions",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsGiftSet",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PackagingName",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "VariantName",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Gardens");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "CategoryTeas");

            migrationBuilder.DropColumn(
                name: "Group",
                table: "CategoryTeas");
        }
    }
}
