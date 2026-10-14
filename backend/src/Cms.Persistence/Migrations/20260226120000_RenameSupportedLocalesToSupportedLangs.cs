using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cms.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameSupportedLocalesToSupportedLangs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SupportedLocalesJson",
                schema: "cms",
                table: "site_settings",
                newName: "SupportedLangsJson");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SupportedLangsJson",
                schema: "cms",
                table: "site_settings",
                newName: "SupportedLocalesJson");
        }
    }
}
