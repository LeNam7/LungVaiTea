using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Seeme.Data.Migrations
{
    /// <inheritdoc />
    public partial class MultilingualFields20261113 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DescriptionEn",
                table: "Teas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "Teas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TypeEn",
                table: "Teas",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionEn",
                table: "TeaGroups",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "TeaGroups",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CollectionNameEn",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionEn",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PackagingNameEn",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StorageInstructionsEn",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserManualEn",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VariantNameEn",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AddressEn",
                table: "Gardens",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionEn",
                table: "Gardens",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "Gardens",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DescriptionEn",
                table: "Teas");

            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "Teas");

            migrationBuilder.DropColumn(
                name: "TypeEn",
                table: "Teas");

            migrationBuilder.DropColumn(
                name: "DescriptionEn",
                table: "TeaGroups");

            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "TeaGroups");

            migrationBuilder.DropColumn(
                name: "CollectionNameEn",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "DescriptionEn",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PackagingNameEn",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "StorageInstructionsEn",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "UserManualEn",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "VariantNameEn",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "AddressEn",
                table: "Gardens");

            migrationBuilder.DropColumn(
                name: "DescriptionEn",
                table: "Gardens");

            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "Gardens");
        }
    }
}
