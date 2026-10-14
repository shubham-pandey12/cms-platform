using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Cms.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "cms");

            migrationBuilder.EnsureSchema(
                name: "mock");

            migrationBuilder.CreateTable(
                name: "audit_logs",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EntityType = table.Column<int>(type: "integer", nullable: false),
                    EntityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Details = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "brands",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Domain = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Subdomain = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Logo = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    PrimaryColor = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SecondaryColor = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    GlobalCss = table.Column<string>(type: "text", nullable: true),
                    CustomFontUrls = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_brands", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "destinations",
                schema: "mock",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Price = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Rating = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false),
                    Image = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Link = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_destinations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "faq_items",
                schema: "mock",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Question = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Answer = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_faq_items", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "gallery_images",
                schema: "mock",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Src = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Alt = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Caption = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gallery_images", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "simple_destinations",
                schema: "mock",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Featured = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_simple_destinations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "travel_packages",
                schema: "mock",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Price = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Duration = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Image = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Rating = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_travel_packages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    BrandIds = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    SecurityStamp = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "widget_categories",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    CategoryId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Icon = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_widget_categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "widget_definitions",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Icon = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Thumbnail = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
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
                    BrandIds = table.Column<string>(type: "jsonb", nullable: false),
                    IsAdvanced = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_widget_definitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "media_items",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Url = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Thumbnail = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Size = table.Column<long>(type: "bigint", nullable: false),
                    BrandId = table.Column<Guid>(type: "uuid", nullable: false),
                    Folder = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Alt = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    UploadedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_media_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_media_items_brands_BrandId",
                        column: x => x.BrandId,
                        principalSchema: "cms",
                        principalTable: "brands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "redirects",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    From = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    To = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    BrandId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_redirects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_redirects_brands_BrandId",
                        column: x => x.BrandId,
                        principalSchema: "cms",
                        principalTable: "brands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "site_layouts",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    BrandId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Header = table.Column<string>(type: "jsonb", nullable: false),
                    Footer = table.Column<string>(type: "jsonb", nullable: false),
                    Sidebar = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_site_layouts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_site_layouts_brands_BrandId",
                        column: x => x.BrandId,
                        principalSchema: "cms",
                        principalTable: "brands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "site_settings",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    BrandId = table.Column<Guid>(type: "uuid", nullable: false),
                    SiteName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SiteDescription = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Favicon = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    OgImage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ShowNavigation = table.Column<bool>(type: "boolean", nullable: false),
                    NavigationPosition = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    NavigationStyle = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ShowLogo = table.Column<bool>(type: "boolean", nullable: false),
                    LogoUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    EnableSearch = table.Column<bool>(type: "boolean", nullable: false),
                    GoogleAnalyticsId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CustomHeadCode = table.Column<string>(type: "text", nullable: false),
                    EnableSocialSharing = table.Column<bool>(type: "boolean", nullable: false),
                    TwitterHandle = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CustomDomain = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RobotsTxt = table.Column<string>(type: "text", nullable: false),
                    CanonicalUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    GlobalCss = table.Column<string>(type: "text", nullable: true),
                    HeadScripts = table.Column<string>(type: "jsonb", nullable: true),
                    BodyScripts = table.Column<string>(type: "jsonb", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_site_settings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_site_settings_brands_BrandId",
                        column: x => x.BrandId,
                        principalSchema: "cms",
                        principalTable: "brands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "templates",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    BrandId = table.Column<Guid>(type: "uuid", nullable: true),
                    BodyContent = table.Column<string>(type: "jsonb", nullable: false),
                    Thumbnail = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_templates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_templates_brands_BrandId",
                        column: x => x.BrandId,
                        principalSchema: "cms",
                        principalTable: "brands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "themes",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Colors_Primary = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Colors_Secondary = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Colors_Background = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Colors_Text = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Colors_Accent = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Fonts_Heading = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Fonts_Body = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    HeadingFontConfig_Family = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    HeadingFontConfig_Weights = table.Column<string>(type: "jsonb", nullable: true),
                    HeadingFontConfig_Fallbacks = table.Column<string>(type: "jsonb", nullable: true),
                    HeadingFontConfig_Source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    HeadingFontConfig_Url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    BodyFontConfig_Family = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    BodyFontConfig_Weights = table.Column<string>(type: "jsonb", nullable: true),
                    BodyFontConfig_Fallbacks = table.Column<string>(type: "jsonb", nullable: true),
                    BodyFontConfig_Source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    BodyFontConfig_Url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    BrandId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_themes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_themes_brands_BrandId",
                        column: x => x.BrandId,
                        principalSchema: "cms",
                        principalTable: "brands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "role_claims",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_claims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_role_claims_roles_RoleId",
                        column: x => x.RoleId,
                        principalSchema: "cms",
                        principalTable: "roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_claims",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_claims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_claims_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "cms",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_logins",
                schema: "cms",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_logins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_user_logins_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "cms",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_roles",
                schema: "cms",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_roles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_user_roles_roles_RoleId",
                        column: x => x.RoleId,
                        principalSchema: "cms",
                        principalTable: "roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_roles_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "cms",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_tokens",
                schema: "cms",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_tokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_user_tokens_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "cms",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pages",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    BrandId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Uri = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IsDynamic = table.Column<bool>(type: "boolean", nullable: false),
                    DynamicVariables = table.Column<string>(type: "jsonb", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Seo_Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Seo_Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Seo_Keywords = table.Column<string>(type: "jsonb", nullable: false),
                    Seo_CanonicalUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Seo_OgTitle = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Seo_OgDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Seo_OgImage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Seo_TwitterCard = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Seo_TwitterTitle = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Seo_TwitterDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Seo_TwitterImage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Seo_NoIndex = table.Column<bool>(type: "boolean", nullable: false),
                    Seo_NoFollow = table.Column<bool>(type: "boolean", nullable: false),
                    LayoutId = table.Column<Guid>(type: "uuid", nullable: false),
                    BodyContent = table.Column<string>(type: "jsonb", nullable: false),
                    ThemeId = table.Column<Guid>(type: "uuid", nullable: true),
                    LayoutConfigJson = table.Column<string>(type: "jsonb", nullable: true),
                    CustomCss = table.Column<string>(type: "text", nullable: true),
                    Version = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "1.0.0"),
                    PublishedRevisionId = table.Column<Guid>(type: "uuid", nullable: true),
                    DraftRevisionId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pages_brands_BrandId",
                        column: x => x.BrandId,
                        principalSchema: "cms",
                        principalTable: "brands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_pages_site_layouts_LayoutId",
                        column: x => x.LayoutId,
                        principalSchema: "cms",
                        principalTable: "site_layouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_pages_themes_ThemeId",
                        column: x => x.ThemeId,
                        principalSchema: "cms",
                        principalTable: "themes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "page_data_configs",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    PageId = table.Column<Guid>(type: "uuid", nullable: false),
                    Variables = table.Column<string>(type: "jsonb", nullable: false),
                    ApiCalls = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_page_data_configs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_page_data_configs_pages_PageId",
                        column: x => x.PageId,
                        principalSchema: "cms",
                        principalTable: "pages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "page_revisions",
                schema: "cms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    PageId = table.Column<Guid>(type: "uuid", nullable: false),
                    LayoutData = table.Column<string>(type: "jsonb", nullable: false),
                    Seo_Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Seo_Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Seo_Keywords = table.Column<string>(type: "jsonb", nullable: false),
                    Seo_CanonicalUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Seo_OgTitle = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Seo_OgDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Seo_OgImage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Seo_TwitterCard = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Seo_TwitterTitle = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Seo_TwitterDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Seo_TwitterImage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Seo_NoIndex = table.Column<bool>(type: "boolean", nullable: false),
                    Seo_NoFollow = table.Column<bool>(type: "boolean", nullable: false),
                    ThemeId = table.Column<Guid>(type: "uuid", nullable: true),
                    LayoutConfigJson = table.Column<string>(type: "jsonb", nullable: true),
                    CustomCss = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_page_revisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_page_revisions_pages_PageId",
                        column: x => x.PageId,
                        principalSchema: "cms",
                        principalTable: "pages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_CreatedAt",
                schema: "cms",
                table: "audit_logs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_EntityId",
                schema: "cms",
                table: "audit_logs",
                column: "EntityId");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_EntityType",
                schema: "cms",
                table: "audit_logs",
                column: "EntityType");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_UserId",
                schema: "cms",
                table: "audit_logs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_brands_Domain",
                schema: "cms",
                table: "brands",
                column: "Domain",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_brands_Subdomain",
                schema: "cms",
                table: "brands",
                column: "Subdomain");

            migrationBuilder.CreateIndex(
                name: "IX_media_items_BrandId",
                schema: "cms",
                table: "media_items",
                column: "BrandId");

            migrationBuilder.CreateIndex(
                name: "IX_media_items_Folder",
                schema: "cms",
                table: "media_items",
                column: "Folder");

            migrationBuilder.CreateIndex(
                name: "IX_page_data_configs_PageId",
                schema: "cms",
                table: "page_data_configs",
                column: "PageId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_page_revisions_PageId",
                schema: "cms",
                table: "page_revisions",
                column: "PageId");

            migrationBuilder.CreateIndex(
                name: "IX_pages_BrandId_Uri",
                schema: "cms",
                table: "pages",
                columns: new[] { "BrandId", "Uri" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pages_LayoutId",
                schema: "cms",
                table: "pages",
                column: "LayoutId");

            migrationBuilder.CreateIndex(
                name: "IX_pages_ThemeId",
                schema: "cms",
                table: "pages",
                column: "ThemeId");

            migrationBuilder.CreateIndex(
                name: "IX_redirects_BrandId_From",
                schema: "cms",
                table: "redirects",
                columns: new[] { "BrandId", "From" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_role_claims_RoleId",
                schema: "cms",
                table: "role_claims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                schema: "cms",
                table: "roles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_site_layouts_BrandId",
                schema: "cms",
                table: "site_layouts",
                column: "BrandId");

            migrationBuilder.CreateIndex(
                name: "IX_site_settings_BrandId",
                schema: "cms",
                table: "site_settings",
                column: "BrandId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_templates_BrandId",
                schema: "cms",
                table: "templates",
                column: "BrandId");

            migrationBuilder.CreateIndex(
                name: "IX_themes_BrandId",
                schema: "cms",
                table: "themes",
                column: "BrandId");

            migrationBuilder.CreateIndex(
                name: "IX_user_claims_UserId",
                schema: "cms",
                table: "user_claims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_logins_UserId",
                schema: "cms",
                table: "user_logins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_RoleId",
                schema: "cms",
                table: "user_roles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                schema: "cms",
                table: "users",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                schema: "cms",
                table: "users",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_widget_categories_CategoryId",
                schema: "cms",
                table: "widget_categories",
                column: "CategoryId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_widget_definitions_Category",
                schema: "cms",
                table: "widget_definitions",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_widget_definitions_Name",
                schema: "cms",
                table: "widget_definitions",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_widget_definitions_Slug",
                schema: "cms",
                table: "widget_definitions",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_logs",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "destinations",
                schema: "mock");

            migrationBuilder.DropTable(
                name: "faq_items",
                schema: "mock");

            migrationBuilder.DropTable(
                name: "gallery_images",
                schema: "mock");

            migrationBuilder.DropTable(
                name: "media_items",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "page_data_configs",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "page_revisions",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "redirects",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "role_claims",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "simple_destinations",
                schema: "mock");

            migrationBuilder.DropTable(
                name: "site_settings",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "templates",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "travel_packages",
                schema: "mock");

            migrationBuilder.DropTable(
                name: "user_claims",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "user_logins",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "user_roles",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "user_tokens",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "widget_categories",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "widget_definitions",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "pages",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "roles",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "users",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "site_layouts",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "themes",
                schema: "cms");

            migrationBuilder.DropTable(
                name: "brands",
                schema: "cms");
        }
    }
}
