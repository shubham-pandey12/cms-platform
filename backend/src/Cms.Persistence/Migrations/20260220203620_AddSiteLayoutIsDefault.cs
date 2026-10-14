using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cms.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSiteLayoutIsDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDefault",
                schema: "cms",
                table: "site_layouts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Set IsDefault = true for one layout per brand: prefer "Default Layout", else first by id
            migrationBuilder.Sql(@"
                UPDATE cms.site_layouts AS sl
                SET ""IsDefault"" = true
                FROM (
                    SELECT DISTINCT ON (""BrandId"") ""Id""
                    FROM cms.site_layouts
                    ORDER BY ""BrandId"", CASE WHEN ""Name"" = 'Default Layout' THEN 0 ELSE 1 END, ""Id""
                ) AS first_per_brand
                WHERE sl.""Id"" = first_per_brand.""Id"";
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDefault",
                schema: "cms",
                table: "site_layouts");
        }
    }
}
