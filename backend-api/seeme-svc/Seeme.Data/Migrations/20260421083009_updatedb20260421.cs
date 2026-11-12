using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Seeme.Data.Migrations
{
    /// <inheritdoc />
    public partial class updatedb20260421 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CityId",
                table: "UserAddress",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsDefault",
                table: "UserAddress",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ProvinceId",
                table: "UserAddress",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ProvinceName",
                table: "UserAddress",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "WardId",
                table: "UserAddress",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "WardName",
                table: "UserAddress",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CityId",
                table: "UserAddress");

            migrationBuilder.DropColumn(
                name: "IsDefault",
                table: "UserAddress");

            migrationBuilder.DropColumn(
                name: "ProvinceId",
                table: "UserAddress");

            migrationBuilder.DropColumn(
                name: "ProvinceName",
                table: "UserAddress");

            migrationBuilder.DropColumn(
                name: "WardId",
                table: "UserAddress");

            migrationBuilder.DropColumn(
                name: "WardName",
                table: "UserAddress");
        }
    }
}
