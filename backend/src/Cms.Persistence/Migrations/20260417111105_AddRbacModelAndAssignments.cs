using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cms.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRbacModelAndAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "rbac_permissions",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IsOrganizationLevel = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rbac_permissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "rbac_roles",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IsSystem = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rbac_roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "rbac_role_permissions",
                schema: "cms",
                columns: table => new
                {
                    RoleDefinitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    PermissionDefinitionId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rbac_role_permissions", x => new { x.RoleDefinitionId, x.PermissionDefinitionId });
                    table.ForeignKey(
                        name: "FK_rbac_role_permissions_rbac_permissions_PermissionDefinition~",
                        column: x => x.PermissionDefinitionId,
                        principalSchema: "cms",
                        principalTable: "rbac_permissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_rbac_role_permissions_rbac_roles_RoleDefinitionId",
                        column: x => x.RoleDefinitionId,
                        principalSchema: "cms",
                        principalTable: "rbac_roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "rbac_user_role_assignments",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleDefinitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScopeType = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    ScopeId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rbac_user_role_assignments", x => x.Id);
                    table.CheckConstraint("CK_rbac_user_role_assignments_scope", "(\"ScopeType\" = 'Organization' AND \"ScopeId\" IS NULL) OR (\"ScopeType\" = 'Brand' AND \"ScopeId\" IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_rbac_user_role_assignments_rbac_roles_RoleDefinitionId",
                        column: x => x.RoleDefinitionId,
                        principalSchema: "cms",
                        principalTable: "rbac_roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_rbac_user_role_assignments_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "cms",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_rbac_permissions_Key",
                schema: "cms",
                table: "rbac_permissions",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_rbac_role_permissions_PermissionDefinitionId",
                schema: "cms",
                table: "rbac_role_permissions",
                column: "PermissionDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_rbac_roles_Key",
                schema: "cms",
                table: "rbac_roles",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_rbac_user_role_assignments_RoleDefinitionId",
                schema: "cms",
                table: "rbac_user_role_assignments",
                column: "RoleDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_rbac_user_role_assignments_UserId_RoleDefinitionId_ScopeTyp~",
                schema: "cms",
                table: "rbac_user_role_assignments",
                columns: new[] { "UserId", "RoleDefinitionId", "ScopeType", "ScopeId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "rbac_role_permissions",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "rbac_user_role_assignments",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "rbac_permissions",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "rbac_roles",
                schema: "cms");
        }
    }
}
