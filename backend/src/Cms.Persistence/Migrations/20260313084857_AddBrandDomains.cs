using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cms.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBrandDomains : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "brand_domains",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    BrandId = table.Column<Guid>(type: "uuid", nullable: false),
                    Domain = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_brand_domains", x => x.Id);
                    table.ForeignKey(
                        name: "FK_brand_domains_brands_BrandId",
                        column: x => x.BrandId,
                        principalSchema: "cms",
                        principalTable: "brands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_brand_domains_BrandId",
                schema: "cms",
                table: "brand_domains",
                column: "BrandId");

            migrationBuilder.CreateIndex(
                name: "IX_brand_domains_Domain",
                schema: "cms",
                table: "brand_domains",
                column: "Domain",
                unique: true);

            // Backfill: one row per existing brand from brands.Domain
            migrationBuilder.Sql(@"
                INSERT INTO cms.brand_domains (""Id"", ""BrandId"", ""Domain"")
                SELECT gen_random_uuid(), ""Id"", ""Domain"" FROM cms.brands;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "brand_domains",
                schema: "cms");
        }
    }
}
