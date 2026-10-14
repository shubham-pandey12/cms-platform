using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cms.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixUserRoleAssignmentUniqueIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_rbac_user_role_assignments_UserId_RoleDefinitionId_ScopeTyp~",
                schema: "cms",
                table: "rbac_user_role_assignments");

            migrationBuilder.CreateIndex(
                name: "IX_rbac_user_role_assignments_ScopeId",
                schema: "cms",
                table: "rbac_user_role_assignments",
                column: "ScopeId");

            migrationBuilder.CreateIndex(
                name: "IX_rbac_user_role_assignments_UserId",
                schema: "cms",
                table: "rbac_user_role_assignments",
                column: "UserId");

            // PostgreSQL treats NULL values as distinct in a standard unique index, which means
            // (user, role, Organization, NULL) rows are never considered duplicates. Replace the
            // dropped index with two partial unique indexes that handle each scope separately.
            migrationBuilder.Sql(@"
                CREATE UNIQUE INDEX ""IX_rbac_ura_org_unique""
                ON cms.""rbac_user_role_assignments"" (""UserId"", ""RoleDefinitionId"", ""ScopeType"")
                WHERE ""ScopeId"" IS NULL;
            ");

            migrationBuilder.Sql(@"
                CREATE UNIQUE INDEX ""IX_rbac_ura_brand_unique""
                ON cms.""rbac_user_role_assignments"" (""UserId"", ""RoleDefinitionId"", ""ScopeType"", ""ScopeId"")
                WHERE ""ScopeId"" IS NOT NULL;
            ");

            // Optional FK: cascade-delete brand-scoped assignments when a brand is removed.
            migrationBuilder.AddForeignKey(
                name: "FK_rbac_user_role_assignments_brands_ScopeId",
                schema: "cms",
                table: "rbac_user_role_assignments",
                column: "ScopeId",
                principalSchema: "cms",
                principalTable: "brands",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_rbac_user_role_assignments_brands_ScopeId",
                schema: "cms",
                table: "rbac_user_role_assignments");

            migrationBuilder.Sql(@"DROP INDEX IF EXISTS cms.""IX_rbac_ura_org_unique"";");
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS cms.""IX_rbac_ura_brand_unique"";");

            migrationBuilder.DropIndex(
                name: "IX_rbac_user_role_assignments_ScopeId",
                schema: "cms",
                table: "rbac_user_role_assignments");

            migrationBuilder.DropIndex(
                name: "IX_rbac_user_role_assignments_UserId",
                schema: "cms",
                table: "rbac_user_role_assignments");

            migrationBuilder.CreateIndex(
                name: "IX_rbac_user_role_assignments_UserId_RoleDefinitionId_ScopeTyp~",
                schema: "cms",
                table: "rbac_user_role_assignments",
                columns: new[] { "UserId", "RoleDefinitionId", "ScopeType", "ScopeId" },
                unique: true);
        }
    }
}
