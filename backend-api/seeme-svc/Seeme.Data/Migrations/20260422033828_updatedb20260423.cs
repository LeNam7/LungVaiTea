using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Seeme.Data.Migrations
{
    /// <inheritdoc />
    public partial class updatedb20260423 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OrderDetails",
                table: "OrderTeas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrderDetails",
                table: "OrderProducts",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OrderDetails",
                table: "OrderTeas");

            migrationBuilder.DropColumn(
                name: "OrderDetails",
                table: "OrderProducts");
        }
    }
}
