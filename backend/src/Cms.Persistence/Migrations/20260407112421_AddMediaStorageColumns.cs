using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cms.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMediaStorageColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BlobContainer",
                schema: "cms",
                table: "media_items",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BlobKey",
                schema: "cms",
                table: "media_items",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "Content",
                schema: "cms",
                table: "media_items",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContentType",
                schema: "cms",
                table: "media_items",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StorageProvider",
                schema: "cms",
                table: "media_items",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BlobContainer",
                schema: "cms",
                table: "media_items");

            migrationBuilder.DropColumn(
                name: "BlobKey",
                schema: "cms",
                table: "media_items");

            migrationBuilder.DropColumn(
                name: "Content",
                schema: "cms",
                table: "media_items");

            migrationBuilder.DropColumn(
                name: "ContentType",
                schema: "cms",
                table: "media_items");

            migrationBuilder.DropColumn(
                name: "StorageProvider",
                schema: "cms",
                table: "media_items");
        }
    }
}
