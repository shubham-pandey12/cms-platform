using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cms.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWidgetSupportsHtmlEmbed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "SupportsHtmlEmbed",
                schema: "cms",
                table: "widget_definitions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SupportsHtmlEmbed",
                schema: "cms",
                table: "widget_definitions");
        }
    }
}
