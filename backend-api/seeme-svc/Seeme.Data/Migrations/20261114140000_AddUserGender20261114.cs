using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Seeme.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserGender20261114 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Cot Gender co trong model (ApplicationDbContextModelSnapshot) nhung bi thieu
            // tren DB production do drift thu cong -> them lai co dieu kien de migration
            // chay duoc tren ca moi truong da co san cot.
            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.Users', 'Gender') IS NULL
BEGIN
    ALTER TABLE [dbo].[Users]
        ADD [Gender] int NOT NULL CONSTRAINT [DF_Users_Gender] DEFAULT(0);
END");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.Users', 'Gender') IS NOT NULL
BEGIN
    IF OBJECT_ID('dbo.DF_Users_Gender', 'D') IS NOT NULL
        ALTER TABLE [dbo].[Users] DROP CONSTRAINT [DF_Users_Gender];
    ALTER TABLE [dbo].[Users] DROP COLUMN [Gender];
END");
        }
    }
}
