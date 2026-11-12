using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Seeme.Data.Migrations
{
    /// <inheritdoc />
    public partial class ProductGroupId20261101 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GroupId",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            // Tái cấu trúc 1/11/2026 (Nhóm trà → Sản phẩm): điền nhóm cho dữ
            // liệu cũ từ slug nhóm của danh mục mà sản phẩm đang trỏ tới.
            // Danh mục không nhóm (Thanh Long Trảo) đã bị xóa cùng sản phẩm
            // trước khi migration này chạy nên không còn hàng nào kẹt NULL vì nó.
            migrationBuilder.Sql(
                "UPDATE p SET p.GroupId = c.[Group] " +
                "FROM Products p INNER JOIN CategoryTeas c ON c.Id = p.CategoryId " +
                "WHERE c.[Group] IS NOT NULL AND c.[Group] <> '';");
            // Set quà luôn thuộc nhóm quà, kể cả khi danh mục của nó lệch.
            migrationBuilder.Sql(
                "UPDATE Products SET GroupId = 'set-qua-tang' WHERE IsGiftSet = 1;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GroupId",
                table: "Products");
        }
    }
}
