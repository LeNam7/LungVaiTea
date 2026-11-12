using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Seeme.Data.Migrations
{
    /// <inheritdoc />
    public partial class updatedb20260729 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "PlantProgress");

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Teas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Volume",
                table: "Teas",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Type",
                table: "Teas");

            migrationBuilder.DropColumn(
                name: "Volume",
                table: "Teas");

            migrationBuilder.AddColumn<int>(
                name: "OwnerId",
                table: "PlantProgress",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
