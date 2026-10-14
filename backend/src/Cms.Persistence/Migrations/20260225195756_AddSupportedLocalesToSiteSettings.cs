using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cms.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSupportedLocalesToSiteSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SupportedLocalesJson",
                schema: "cms",
                table: "site_settings",
                type: "jsonb",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SupportedLocalesJson",
                schema: "cms",
                table: "site_settings");
        }
    }
}
