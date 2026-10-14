using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cms.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWidgetVersioning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "LatestVersionId",
                schema: "cms",
                table: "widget_definitions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "widget_definition_versions",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ConfigSchema = table.Column<string>(type: "jsonb", nullable: false),
                    DefaultConfig = table.Column<string>(type: "jsonb", nullable: false),
                    DefaultStyles_BackgroundColor = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    DefaultStyles_TextColor = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    DefaultStyles_Padding = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    DefaultStyles_Margin = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    DefaultStyles_BorderRadius = table.Column<int>(type: "integer", nullable: true),
                    DefaultStyles_BorderWidth = table.Column<int>(type: "integer", nullable: true),
                    DefaultStyles_BorderColor = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    DefaultStyles_Shadow = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    DefaultStyles_Opacity = table.Column<int>(type: "integer", nullable: true),
                    DefaultStyles_TextAlign = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    DefaultStyles_CustomClasses = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ChangeLog = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    IsLatest = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeprecated = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    WidgetDefinitionId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_widget_definition_versions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_widget_definition_versions_widget_definitions_WidgetDefinit~",
                        column: x => x.WidgetDefinitionId,
                        principalSchema: "cms",
                        principalTable: "widget_definitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_widget_definition_versions_IsLatest",
                schema: "cms",
                table: "widget_definition_versions",
                column: "IsLatest");

            migrationBuilder.CreateIndex(
                name: "IX_widget_definition_versions_Slug",
                schema: "cms",
                table: "widget_definition_versions",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "IX_widget_definition_versions_Slug_Version",
                schema: "cms",
                table: "widget_definition_versions",
                columns: new[] { "Slug", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_widget_definition_versions_WidgetDefinitionId",
                schema: "cms",
                table: "widget_definition_versions",
                column: "WidgetDefinitionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "widget_definition_versions",
                schema: "cms");

            migrationBuilder.DropColumn(
                name: "LatestVersionId",
                schema: "cms",
                table: "widget_definitions");
        }
    }
}
