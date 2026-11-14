using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Seeme.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserRole20261114 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Them cot Role de phan biet admin voi khach hang. Truoc day he thong
            // khong co khai niem nay: moi tai khoan da dang nhap deu goi duoc API
            // quan tri, va CMS chi chan bang cach so sanh so dien thoai.
            // Mac dinh 3 = Role.User de tai khoan san co khong bi nang quyen.
            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.Users', 'Role') IS NULL
BEGIN
    ALTER TABLE [dbo].[Users]
        ADD [Role] int NOT NULL CONSTRAINT [DF_Users_Role] DEFAULT(3);
END");

            // Nang tai khoan quan tri hien huu len Admin (1).
            // Dung PhoneNumber thay vi Id cho on dinh giua cac moi truong.
            migrationBuilder.Sql(@"
UPDATE [dbo].[Users] SET [Role] = 1 WHERE [PhoneNumber] = '0980029269';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH('dbo.Users', 'Role') IS NOT NULL
BEGIN
    IF OBJECT_ID('dbo.DF_Users_Role', 'D') IS NOT NULL
        ALTER TABLE [dbo].[Users] DROP CONSTRAINT [DF_Users_Role];
    ALTER TABLE [dbo].[Users] DROP COLUMN [Role];
END");
        }
    }
}
