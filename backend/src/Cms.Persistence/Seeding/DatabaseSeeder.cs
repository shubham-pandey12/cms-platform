using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Cms.Application.Common.Security;
using Cms.Domain.Entities;
using Cms.Domain.Entities.MockData;
using Cms.Domain.Enums;
using Cms.Domain.ValueObjects;
using System.Text.Json;

namespace Cms.Persistence.Seeding;

/// <summary>
/// Seeds the database with initial mock data from the frontend.
/// </summary>
public sealed class DatabaseSeeder
{
    private readonly CmsDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;
    private readonly ILogger<DatabaseSeeder> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public DatabaseSeeder(
        CmsDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        ILogger<DatabaseSeeder> logger)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
        _logger = logger;
    }

    /// <summary>
    /// Seeds all data if the database is empty.
    /// </summary>
    public async Task SeedAsync()
    {
        _logger.LogInformation("Synchronizing widget definitions...");
        await SeedWidgetDefinitionsAsync();

        if (await _context.Brands.AnyAsync())
        {
            await SeedRbacAsync();
            _logger.LogInformation("Core bootstrap data already exists, skipping one-time seed. Widget definitions were synchronized.");
            return;
        }

        _logger.LogInformation("Starting one-time bootstrap database seeding...");

        await SeedRolesAsync();
        await SeedUsersAsync();
        await SeedRbacAsync();
        await SeedWidgetCategoriesAsync();
        await SeedThemesAsync();
        await SeedBrandsAsync();
        await SeedSiteLayoutsAsync();
        await SeedSiteSettingsAsync();
        await SeedPagesAsync();
        await SeedPageDataConfigsAsync();
        await SeedTemplatesAsync();
        await SeedMediaItemsAsync();
        await SeedRedirectsAsync();
        await SeedAuditLogsAsync();

        // Seed mock data for widgets
        await SeedGalleryImagesAsync();
        await SeedDestinationsAsync();
        await SeedFaqItemsAsync();
        await SeedTravelPackagesAsync();
        await SeedSimpleDestinationsAsync();

        _logger.LogInformation("Database seeding completed successfully");
    }

    private async Task SeedRbacAsync()
    {
        var permissions = new List<PermissionDefinition>
        {
            new() { Id = RbacPermissionIds.UsersRead, Key = PermissionCatalog.UsersRead, Name = "Read users", Description = "View users and role assignments", IsOrganizationLevel = true },
            new() { Id = RbacPermissionIds.UsersManage, Key = PermissionCatalog.UsersManage, Name = "Manage users", Description = "Create/update users and assignments", IsOrganizationLevel = true },
            new() { Id = RbacPermissionIds.BrandsManage, Key = PermissionCatalog.BrandsManage, Name = "Manage brands", Description = "Create/update/delete brands", IsOrganizationLevel = true },
            new() { Id = RbacPermissionIds.RedirectsManage, Key = PermissionCatalog.RedirectsManage, Name = "Manage redirects", Description = "Manage brand redirects", IsOrganizationLevel = false },
            new() { Id = RbacPermissionIds.ThemesRead, Key = PermissionCatalog.ThemesRead, Name = "Read themes", Description = "View themes", IsOrganizationLevel = false },
            new() { Id = RbacPermissionIds.ThemesManage, Key = PermissionCatalog.ThemesManage, Name = "Manage themes", Description = "Create/update/delete themes", IsOrganizationLevel = true },
            new() { Id = RbacPermissionIds.ThemesDelete, Key = PermissionCatalog.ThemesDelete, Name = "Delete themes", Description = "Delete theme definitions", IsOrganizationLevel = true },
            new() { Id = RbacPermissionIds.MediaRead, Key = PermissionCatalog.MediaRead, Name = "Read media", Description = "View media library", IsOrganizationLevel = false },
            new() { Id = RbacPermissionIds.MediaManage, Key = PermissionCatalog.MediaManage, Name = "Manage media", Description = "Upload and update media", IsOrganizationLevel = false },
            new() { Id = RbacPermissionIds.RolesRead, Key = PermissionCatalog.RolesRead, Name = "Read roles", Description = "View roles and permissions", IsOrganizationLevel = true },
            new() { Id = RbacPermissionIds.RolesManage, Key = PermissionCatalog.RolesManage, Name = "Manage roles", Description = "Update role permissions", IsOrganizationLevel = true },
        };

        foreach (var permission in permissions)
        {
            var existing = await _context.PermissionDefinitions.FirstOrDefaultAsync(p => p.Key == permission.Key);
            if (existing is null)
            {
                _context.PermissionDefinitions.Add(permission);
            }
            else
            {
                existing.Name = permission.Name;
                existing.Description = permission.Description;
                existing.IsOrganizationLevel = permission.IsOrganizationLevel;
                existing.UpdatedAt = DateTime.UtcNow;
            }
        }

        var roles = new List<RoleDefinition>
        {
            new() { Id = RbacRoleIds.Admin, Key = "admin", Name = "Admin", Description = "Full administrative access", IsSystem = true },
            new() { Id = RbacRoleIds.ContentTeam, Key = "content_team", Name = "Content team", Description = "Content editing and publishing", IsSystem = true },
            new() { Id = RbacRoleIds.Engineer, Key = "engineer", Name = "Engineer", Description = "Engineering and theme/media maintenance", IsSystem = true },
        };

        foreach (var role in roles)
        {
            var existing = await _context.RoleDefinitions.FirstOrDefaultAsync(r => r.Key == role.Key);
            if (existing is null)
            {
                _context.RoleDefinitions.Add(role);
            }
            else
            {
                existing.Name = role.Name;
                existing.Description = role.Description;
                existing.IsSystem = role.IsSystem;
                existing.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();

        var permissionByKey = await _context.PermissionDefinitions.ToDictionaryAsync(p => p.Key, StringComparer.OrdinalIgnoreCase);
        var roleByKey = await _context.RoleDefinitions.ToDictionaryAsync(r => r.Key, StringComparer.OrdinalIgnoreCase);

        var roleMappings = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["admin"] =
            [
                PermissionCatalog.UsersRead,
                PermissionCatalog.UsersManage,
                PermissionCatalog.BrandsManage,
                PermissionCatalog.RedirectsManage,
                PermissionCatalog.ThemesRead,
                PermissionCatalog.ThemesManage,
                PermissionCatalog.ThemesDelete,
                PermissionCatalog.MediaRead,
                PermissionCatalog.MediaManage,
                PermissionCatalog.RolesRead,
                PermissionCatalog.RolesManage
            ],
            ["content_team"] =
            [
                PermissionCatalog.UsersRead,
                PermissionCatalog.ThemesRead,
                PermissionCatalog.MediaRead,
                PermissionCatalog.MediaManage
            ],
            ["engineer"] =
            [
                PermissionCatalog.UsersRead,
                PermissionCatalog.ThemesRead,
                PermissionCatalog.ThemesManage,
                PermissionCatalog.MediaRead,
                PermissionCatalog.MediaManage
            ]
        };

        foreach (var mapping in roleMappings)
        {
            if (!roleByKey.TryGetValue(mapping.Key, out var role))
            {
                continue;
            }

            var desiredPermissionIds = mapping.Value
                .Where(k => permissionByKey.ContainsKey(k))
                .Select(k => permissionByKey[k].Id)
                .ToHashSet();

            var existingRows = await _context.RolePermissions
                .Where(x => x.RoleDefinitionId == role.Id)
                .ToListAsync();

            // Remove stale rows that are no longer in the desired set.
            foreach (var stale in existingRows.Where(x => !desiredPermissionIds.Contains(x.PermissionDefinitionId)))
            {
                _context.RolePermissions.Remove(stale);
            }

            // Add missing rows.
            var existingIds = existingRows.Select(x => x.PermissionDefinitionId).ToHashSet();
            foreach (var permissionId in desiredPermissionIds.Where(id => !existingIds.Contains(id)))
            {
                _context.RolePermissions.Add(new RolePermission
                {
                    RoleDefinitionId = role.Id,
                    PermissionDefinitionId = permissionId
                });
            }
        }

        await _context.SaveChangesAsync();
        await BootstrapAssignmentsFromIdentityRolesAsync(roleByKey);
        await EnsureAtLeastOneOrganizationAdminAsync(roleByKey);
    }

    private async Task BootstrapAssignmentsFromIdentityRolesAsync(Dictionary<string, RoleDefinition> roleByKey)
    {
        var users = await _userManager.Users.ToListAsync();
        foreach (var user in users)
        {
            var identityRoles = await _userManager.GetRolesAsync(user);
            foreach (var identityRole in identityRoles)
            {
                var roleKey = identityRole.Equals(nameof(UserRole.ContentTeam), StringComparison.OrdinalIgnoreCase)
                    ? "content_team"
                    : identityRole.Equals(nameof(UserRole.Engineer), StringComparison.OrdinalIgnoreCase)
                        ? "engineer"
                        : identityRole.Equals(nameof(UserRole.Admin), StringComparison.OrdinalIgnoreCase)
                            ? "admin"
                            : string.Empty;

                if (string.IsNullOrWhiteSpace(roleKey) || !roleByKey.TryGetValue(roleKey, out var roleDefinition))
                {
                    continue;
                }

                var exists = await _context.UserRoleAssignments.AnyAsync(x =>
                    x.UserId == user.Id
                    && x.RoleDefinitionId == roleDefinition.Id
                    && x.ScopeType == AssignmentScopeType.Organization
                    && x.ScopeId == null);

                if (!exists)
                {
                    _context.UserRoleAssignments.Add(new UserRoleAssignment
                    {
                        UserId = user.Id,
                        RoleDefinitionId = roleDefinition.Id,
                        ScopeType = AssignmentScopeType.Organization
                    });
                }
            }
        }

        await _context.SaveChangesAsync();
    }

    private async Task EnsureAtLeastOneOrganizationAdminAsync(Dictionary<string, RoleDefinition> roleByKey)
    {
        if (!roleByKey.TryGetValue("admin", out var adminRole))
        {
            throw new InvalidOperationException("RBAC bootstrap failed: admin role definition missing.");
        }

        var hasOrgAdmin = await _context.UserRoleAssignments.AnyAsync(x =>
            x.RoleDefinitionId == adminRole.Id
            && x.ScopeType == AssignmentScopeType.Organization
            && x.ScopeId == null);

        if (!hasOrgAdmin)
        {
            throw new InvalidOperationException(
                "RBAC bootstrap failed: no organization-scoped admin assignment found. " +
                "Run emergency bootstrap assignment workflow before starting the API.");
        }
    }

    private async Task SeedRolesAsync()
    {
        var roles = new[] { "Admin", "ContentTeam", "Engineer" };
        foreach (var role in roles)
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                await _roleManager.CreateAsync(new IdentityRole<Guid>(role));
            }
        }
    }

    private async Task SeedUsersAsync()
    {
        var users = new[]
        {
            new
            {
                Email = "admin@example.com", Name = "Admin User", Password = "Admin123!", Role = UserRole.Admin,
                BrandIds = new List<Guid>()
            },
            new
            {
                Email = "content@example.com", Name = "Content Editor", Password = "Content123!",
                Role = UserRole.ContentTeam,
                BrandIds = new List<Guid> { BrandIds.Brand1 }
            },
            new
            {
                Email = "editor@example.com", Name = "Demo Editor", Password = "Sarah123!",
                Role = UserRole.ContentTeam, BrandIds = new List<Guid>()
            },
            new
            {
                Email = "author@example.com", Name = "Demo Contributor", Password = "Mike123!",
                Role = UserRole.Engineer, BrandIds = new List<Guid>()
            },
        };

        foreach (var userData in users)
        {
            if (await _userManager.FindByEmailAsync(userData.Email) is null)
            {
                var user = new ApplicationUser
                {
                    UserName = userData.Email,
                    Email = userData.Email,
                    Name = userData.Name,
                    BrandIds = userData.BrandIds,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                };

                var result = await _userManager.CreateAsync(user, userData.Password);
                if (result.Succeeded)
                {
                    await _userManager.AddToRoleAsync(user, userData.Role.ToString());
                }
            }
        }
    }

    private async Task SeedWidgetCategoriesAsync()
    {
        var categories = new List<WidgetCategoryDefinition>
        {
            new()
            {
                Id = Guid.NewGuid(), CategoryId = "layout", Name = "Layout", Icon = "layout-grid",
                Description = "Structure and layout components", Order = 1
            },
            new()
            {
                Id = Guid.NewGuid(), CategoryId = "content", Name = "Content", Icon = "type",
                Description = "Text and content blocks", Order = 2
            },
            new()
            {
                Id = Guid.NewGuid(), CategoryId = "media", Name = "Media", Icon = "image",
                Description = "Images, videos, and galleries", Order = 3
            },
            new()
            {
                Id = Guid.NewGuid(), CategoryId = "interactive", Name = "Interactive", Icon = "mouse-pointer-click",
                Description = "Forms, buttons, and actions", Order = 4
            },
            new()
            {
                Id = Guid.NewGuid(), CategoryId = "navigation", Name = "Navigation", Icon = "menu",
                Description = "Menus and navigation elements", Order = 5
            },
        };

        await _context.WidgetCategories.AddRangeAsync(categories);
        await _context.SaveChangesAsync();
    }

    private async Task SeedThemesAsync()
    {
        var themes = new List<Theme>
        {
            new()
            {
                Id = ThemeIds.Simple,
                Name = "Simple",
                IsDefault = true,
                Colors = new ThemeColors
                {
                    Primary = "#0891b2", Secondary = "#1e293b", Background = "#ffffff", Text = "#1e293b",
                    Accent = "#0891b2"
                },
                Fonts = new ThemeFonts { Heading = "Plus Jakarta Sans", Body = "Plus Jakarta Sans" }
            },
            new()
            {
                Id = ThemeIds.Vision,
                Name = "Vision",
                Colors = new ThemeColors
                {
                    Primary = "#7c3aed", Secondary = "#4c1d95", Background = "#faf5ff", Text = "#1e1b4b",
                    Accent = "#a855f7"
                },
                Fonts = new ThemeFonts { Heading = "Outfit", Body = "Inter" }
            },
            new()
            {
                Id = ThemeIds.Aristotle,
                Name = "Aristotle",
                Colors = new ThemeColors
                {
                    Primary = "#047857", Secondary = "#064e3b", Background = "#ecfdf5", Text = "#022c22",
                    Accent = "#10b981"
                },
                Fonts = new ThemeFonts { Heading = "Playfair Display", Body = "Lato" }
            },
            new()
            {
                Id = ThemeIds.Modern,
                Name = "Modern",
                Colors = new ThemeColors
                {
                    Primary = "#2563eb", Secondary = "#1e40af", Background = "#f8fafc", Text = "#0f172a",
                    Accent = "#3b82f6"
                },
                Fonts = new ThemeFonts { Heading = "Montserrat", Body = "Open Sans" }
            },
            new()
            {
                Id = ThemeIds.Diplomat,
                Name = "Diplomat",
                Colors = new ThemeColors
                {
                    Primary = "#0d9488", Secondary = "#115e59", Background = "#f0fdfa", Text = "#134e4a",
                    Accent = "#14b8a6"
                },
                Fonts = new ThemeFonts { Heading = "Cormorant Garamond", Body = "Source Sans Pro" }
            },
            new()
            {
                Id = ThemeIds.Dark,
                Name = "Dark Mode",
                Colors = new ThemeColors
                {
                    Primary = "#f59e0b", Secondary = "#d97706", Background = "#18181b", Text = "#fafafa",
                    Accent = "#fbbf24"
                },
                Fonts = new ThemeFonts { Heading = "Space Grotesk", Body = "Inter" }
            },
            new()
            {
                Id = ThemeIds.Luxury,
                Name = "Luxury",
                Colors = new ThemeColors
                {
                    Primary = "#b45309", Secondary = "#78350f", Background = "#fffbeb", Text = "#451a03",
                    Accent = "#d97706"
                },
                Fonts = new ThemeFonts { Heading = "Cinzel", Body = "Raleway" }
            },
            new()
            {
                Id = ThemeIds.Ocean,
                Name = "Ocean",
                Colors = new ThemeColors
                {
                    Primary = "#0284c7", Secondary = "#0369a1", Background = "#f0f9ff", Text = "#0c4a6e",
                    Accent = "#0ea5e9"
                },
                Fonts = new ThemeFonts { Heading = "Poppins", Body = "Nunito" }
            },
        };

        await _context.Themes.AddRangeAsync(themes);
        await _context.SaveChangesAsync();
    }

    private async Task SeedBrandsAsync()
    {
        var brands = new List<Brand>
        {
            new() { Id = BrandIds.Brand1, Name = "Sample Brand", Domain = "brand.example.com", Subdomain = "sample-brand", PrimaryColor = "#0891b2", SecondaryColor = "#164e63", Logo = "https://api.dicebear.com/7.x/initials/svg?seed=SB&backgroundColor=0891b2", GlobalCss = "/* Sample brand styles */\n.brand-highlight { color: #0891b2; }", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
        };

        await _context.Brands.AddRangeAsync(brands);
        await _context.SaveChangesAsync();
    }

    private async Task SeedSiteLayoutsAsync()
    {
        var headerWidgets = JsonSerializer.Serialize(new[]
        {
            new
            {
                id = "header-nav-1", widgetDefinitionId = "50000000-0000-0000-0000-000000000002",
                config = new
                {
                    logoText = "Sample Brand", sticky = true,
                    menuItems = new[]
                    {
                        new { id = "m1", label = "Home", url = "/", target = "_self" },
                        new { id = "m2", label = "Destinations", url = "/destinations", target = "_self" },
                        new { id = "m3", label = "About", url = "/about", target = "_self" },
                        new { id = "m4", label = "Contact", url = "/contact", target = "_self" }
                    }
                },
                order = 0, isVisible = true
            }
        }, JsonOptions);

        var footerWidgets = JsonSerializer.Serialize(new[]
        {
            new
            {
                id = "footer-1", widgetDefinitionId = "50000000-0000-0000-0000-000000000007",
                config = new { brandName = "Sample Brand", copyrightText = "© 2024 Sample Brand. All rights reserved." },
                order = 0, isVisible = true
            }
        }, JsonOptions);

        var layouts = new List<SiteLayout>
        {
            new()
            {
                Id = LayoutIds.Default, BrandId = BrandIds.Brand1, Name = "Default Layout", Header = headerWidgets,
                Footer = footerWidgets, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), CreatedBy = UserIds.Admin,
                UpdatedBy = UserIds.Admin
            },
        };

        await _context.SiteLayouts.AddRangeAsync(layouts);
        await _context.SaveChangesAsync();
    }

    private async Task SeedSiteSettingsAsync()
    {
        var headScripts = JsonSerializer.Serialize(new[]
        {
            new
            {
                id = "script-ga", name = "Google Analytics",
                src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX", async_ = true, position = "head",
                enabled = true
            }
        }, JsonOptions);

        var settings = new List<SiteSettings>
        {
            new()
            {
                Id = Guid.NewGuid(),
                BrandId = BrandIds.Brand1,
                SiteName = "Sample Brand",
                SiteDescription = "Luxury travel experiences worldwide",
                Favicon = "https://api.dicebear.com/7.x/initials/svg?seed=TL&backgroundColor=0891b2&size=32",
                OgImage = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=630&fit=crop",
                ShowNavigation = true,
                NavigationPosition = "top",
                NavigationStyle = "standard",
                ShowLogo = true,
                LogoUrl = "https://api.dicebear.com/7.x/initials/svg?seed=TL&backgroundColor=0891b2&size=200",
                EnableSearch = true,
                GoogleAnalyticsId = "G-XXXXXXXXXX",
                EnableSocialSharing = true,
                TwitterHandle = "@sample-brand",
                CustomDomain = "brand.example.com",
                RobotsTxt = "User-agent: *\nAllow: /",
                CanonicalUrl = "https://brand.example.com",
                GlobalCss = "/* Site-level custom styles */\n:root {\n  --site-accent: #0891b2;\n}",
                HeadScripts = headScripts,
                UpdatedAt = new DateTime(2024, 2, 1, 0, 0, 0, DateTimeKind.Utc)
            },
        };

        await _context.SiteSettings.AddRangeAsync(settings);
        await _context.SaveChangesAsync();
    }

    private async Task SeedWidgetDefinitionsAsync()
    {
        var discoveryResult = WidgetDefinitionDiscovery.DiscoverAll();
        var discovered = discoveryResult.Definitions;
        var discoveredVersions = discoveryResult.Versions;

        if (discovered.Count == 0)
        {
            _logger.LogWarning("No widget definitions were discovered in the widgets folder.");
            return;
        }

        var existingWidgets = await _context.WidgetDefinitions
            .ToListAsync();

        var existingById = existingWidgets.ToDictionary(w => w.Id);
        var existingBySlug = new Dictionary<string, WidgetDefinition>(StringComparer.OrdinalIgnoreCase);
        foreach (var existingWidget in existingWidgets)
        {
            if (existingBySlug.TryGetValue(existingWidget.Slug, out var duplicateSlugWidget))
            {
                throw new InvalidOperationException(
                    $"Duplicate widget slug '{existingWidget.Slug}' already exists in database for Ids '{duplicateSlugWidget.Id}' and '{existingWidget.Id}'.");
            }

            existingBySlug[existingWidget.Slug] = existingWidget;
        }

        var addedCount = 0;
        var updatedCount = 0;
        var migratedCount = 0;
        foreach (var discoveredWidget in discovered)
        {
            var hasById = existingById.TryGetValue(discoveredWidget.Id, out var existingByIdWidget);
            var hasBySlug = existingBySlug.TryGetValue(discoveredWidget.Slug, out var existingBySlugWidget);

            if (hasById && hasBySlug && !ReferenceEquals(existingByIdWidget, existingBySlugWidget))
            {
                throw new InvalidOperationException(
                    $"Widget definition mapping conflict for slug '{discoveredWidget.Slug}' and Id '{discoveredWidget.Id}'. " +
                    $"Slug belongs to Id '{existingBySlugWidget!.Id}' while Id belongs to slug '{existingByIdWidget!.Slug}'.");
            }

            if (hasById || hasBySlug)
            {
                var existingWidget = existingByIdWidget ?? existingBySlugWidget!;

                if (existingWidget.Id != discoveredWidget.Id && existingWidget.Slug.Equals(discoveredWidget.Slug, StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning(
                        "Widget definition '{Slug}' has ID mismatch. DB has '{OldId}', discovered '{NewId}'. Migrating to new ID.",
                        discoveredWidget.Slug, existingWidget.Id, discoveredWidget.Id);

                    _context.WidgetDefinitions.Remove(existingWidget);
                    existingById.Remove(existingWidget.Id);
                    existingBySlug.Remove(existingWidget.Slug);

                    await _context.WidgetDefinitions.AddAsync(discoveredWidget);
                    existingById[discoveredWidget.Id] = discoveredWidget;
                    existingBySlug[discoveredWidget.Slug] = discoveredWidget;
                    migratedCount++;
                    continue;
                }

                if (existingWidget.Id != discoveredWidget.Id || !existingWidget.Slug.Equals(discoveredWidget.Slug, StringComparison.OrdinalIgnoreCase))
                {
                    throw new InvalidOperationException(
                        $"Widget definition identity mismatch for discovered widget '{discoveredWidget.Slug}' ({discoveredWidget.Id}). " +
                        $"Existing row has slug '{existingWidget.Slug}' and Id '{existingWidget.Id}'.");
                }

                if (ApplyWidgetDefinitionUpdates(existingWidget, discoveredWidget))
                {
                    updatedCount++;
                }

                continue;
            }

            await _context.WidgetDefinitions.AddAsync(discoveredWidget);
            existingById[discoveredWidget.Id] = discoveredWidget;
            existingBySlug[discoveredWidget.Slug] = discoveredWidget;
            addedCount++;
        }

        var discoveredSlugs = discovered
            .Select(w => w.Slug)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var staleWidgetSlugs = existingWidgets
            .Where(w => !discoveredSlugs.Contains(w.Slug))
            .Select(w => w.Slug)
            .OrderBy(s => s, StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (staleWidgetSlugs.Count > 0)
        {
            _logger.LogWarning(
                "Widget definitions exist in DB but were not discovered from widgets folder: {StaleSlugs}. They were kept to avoid breaking existing pages.",
                staleWidgetSlugs);
        }

        await _context.SaveChangesAsync();

        await SeedWidgetVersionsAsync(discoveredVersions, existingBySlug);

        if (addedCount == 0 && updatedCount == 0)
        {
            _logger.LogInformation("Widget definition synchronization completed with no changes.");
            return;
        }

        _logger.LogInformation(
            "Widget definition synchronization completed. Added: {AddedCount}, Updated: {UpdatedCount}, Migrated: {MigratedCount}.",
            addedCount,
            updatedCount,
            migratedCount);
    }

    private async Task SeedWidgetVersionsAsync(
        List<WidgetDefinitionVersion> discoveredVersions,
        Dictionary<string, WidgetDefinition> existingBySlug)
    {
        if (discoveredVersions.Count == 0)
        {
            return;
        }

        var existingVersions = await _context.WidgetDefinitionVersions.ToListAsync();
        var existingVersionsById = existingVersions.ToDictionary(v => v.Id);
        var existingVersionsBySlugVersion = existingVersions
            .ToDictionary(v => $"{v.Slug}:{v.Version}".ToLowerInvariant());

        var addedVersions = 0;
        var updatedVersions = 0;

        foreach (var version in discoveredVersions)
        {
            if (!existingBySlug.TryGetValue(version.Slug, out var parentDefinition))
            {
                _logger.LogWarning(
                    "Skipping version {Version} for widget {Slug}: parent definition not found.",
                    version.Version, version.Slug);
                continue;
            }

            version.WidgetDefinitionId = parentDefinition.Id;
            var key = $"{version.Slug}:{version.Version}".ToLowerInvariant();

            if (existingVersionsById.TryGetValue(version.Id, out var existingById))
            {
                if (ApplyVersionUpdates(existingById, version))
                {
                    updatedVersions++;
                }
            }
            else if (existingVersionsBySlugVersion.TryGetValue(key, out var existingByKey))
            {
                if (ApplyVersionUpdates(existingByKey, version))
                {
                    updatedVersions++;
                }
            }
            else
            {
                await _context.WidgetDefinitionVersions.AddAsync(version);
                existingVersionsById[version.Id] = version;
                existingVersionsBySlugVersion[key] = version;
                addedVersions++;
            }

            if (version.IsLatest && existingBySlug.TryGetValue(version.Slug, out var definition))
            {
                definition.LatestVersionId = version.Id;
            }
        }

        foreach (var existingVersion in existingVersions)
        {
            var isStillDiscovered = discoveredVersions.Any(v =>
                v.Slug.Equals(existingVersion.Slug, StringComparison.OrdinalIgnoreCase) &&
                v.Version.Equals(existingVersion.Version, StringComparison.OrdinalIgnoreCase));

            if (!isStillDiscovered && existingVersion.IsLatest)
            {
                existingVersion.IsLatest = false;
            }
        }

        if (addedVersions > 0 || updatedVersions > 0)
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation(
                "Widget version synchronization completed. Added: {AddedCount}, Updated: {UpdatedCount}.",
                addedVersions, updatedVersions);
        }
    }

    private static bool ApplyVersionUpdates(WidgetDefinitionVersion target, WidgetDefinitionVersion source)
    {
        var hasChanges = false;

        hasChanges |= AssignIfChanged(target.Name, source.Name, value => target.Name = value);
        hasChanges |= AssignIfChanged(target.Description, source.Description, value => target.Description = value);
        hasChanges |= AssignIfChanged(target.Version, source.Version, value => target.Version = value);
        hasChanges |= AssignIfChanged(target.ConfigSchema, source.ConfigSchema, value => target.ConfigSchema = value);
        hasChanges |= AssignIfChanged(target.DefaultConfig, source.DefaultConfig, value => target.DefaultConfig = value);
        hasChanges |= AssignIfChanged(target.ChangeLog, source.ChangeLog, value => target.ChangeLog = value);
        hasChanges |= AssignIfChanged(target.IsLatest, source.IsLatest, value => target.IsLatest = value);
        hasChanges |= AssignIfChanged(target.IsDeprecated, source.IsDeprecated, value => target.IsDeprecated = value);
        hasChanges |= AssignIfChanged(target.WidgetDefinitionId, source.WidgetDefinitionId, value => target.WidgetDefinitionId = value);

        if (!AreWidgetStylesEqual(target.DefaultStyles, source.DefaultStyles))
        {
            target.DefaultStyles = CloneWidgetStyles(source.DefaultStyles);
            hasChanges = true;
        }

        return hasChanges;
    }

    private static bool ApplyWidgetDefinitionUpdates(WidgetDefinition target, WidgetDefinition source)
    {
        var hasChanges = false;

        hasChanges |= AssignIfChanged(target.Name, source.Name, value => target.Name = value);
        hasChanges |= AssignIfChanged(target.Category, source.Category, value => target.Category = value);
        hasChanges |= AssignIfChanged(target.Description, source.Description, value => target.Description = value);
        hasChanges |= AssignIfChanged(target.Icon, source.Icon, value => target.Icon = value);
        hasChanges |= AssignIfChanged(target.Version, source.Version, value => target.Version = value);
        hasChanges |= AssignIfChanged(target.Thumbnail, source.Thumbnail, value => target.Thumbnail = value);
        hasChanges |= AssignIfChanged(target.ConfigSchema, source.ConfigSchema, value => target.ConfigSchema = value);
        hasChanges |= AssignIfChanged(target.DefaultConfig, source.DefaultConfig, value => target.DefaultConfig = value);
        hasChanges |= AssignIfChanged(target.IsAdvanced, source.IsAdvanced, value => target.IsAdvanced = value);
        hasChanges |= AssignIfChanged(
            target.SupportsHtmlEmbed,
            source.SupportsHtmlEmbed,
            value => target.SupportsHtmlEmbed = value);
        hasChanges |= AssignIfChanged(target.UpdatedAt, source.UpdatedAt, value => target.UpdatedAt = value);

        var targetBrandIds = target.BrandIds ?? [];
        var sourceBrandIds = source.BrandIds ?? [];
        if (!targetBrandIds.SequenceEqual(sourceBrandIds))
        {
            target.BrandIds = [..sourceBrandIds];
            hasChanges = true;
        }

        if (!AreWidgetStylesEqual(target.DefaultStyles, source.DefaultStyles))
        {
            target.DefaultStyles = CloneWidgetStyles(source.DefaultStyles);
            hasChanges = true;
        }

        return hasChanges;
    }

    private static bool AssignIfChanged<T>(T current, T incoming, Action<T> assign)
    {
        if (EqualityComparer<T>.Default.Equals(current, incoming))
        {
            return false;
        }

        assign(incoming);
        return true;
    }

    private static bool AreWidgetStylesEqual(WidgetStyles? first, WidgetStyles? second)
    {
        if (first is null && second is null)
        {
            return true;
        }

        if (first is null || second is null)
        {
            return false;
        }

        return first.BackgroundColor == second.BackgroundColor
            && first.TextColor == second.TextColor
            && first.Padding == second.Padding
            && first.Margin == second.Margin
            && first.BorderRadius == second.BorderRadius
            && first.BorderWidth == second.BorderWidth
            && first.BorderColor == second.BorderColor
            && first.Shadow == second.Shadow
            && first.Opacity == second.Opacity
            && first.TextAlign == second.TextAlign
            && first.CustomClasses == second.CustomClasses;
    }

    private static WidgetStyles? CloneWidgetStyles(WidgetStyles? source)
    {
        if (source is null)
        {
            return null;
        }

        return new WidgetStyles
        {
            BackgroundColor = source.BackgroundColor,
            TextColor = source.TextColor,
            Padding = source.Padding,
            Margin = source.Margin,
            BorderRadius = source.BorderRadius,
            BorderWidth = source.BorderWidth,
            BorderColor = source.BorderColor,
            Shadow = source.Shadow,
            Opacity = source.Opacity,
            TextAlign = source.TextAlign,
            CustomClasses = source.CustomClasses
        };
    }

    private async Task SeedPagesAsync()
    {
        var homeBodyContent = JsonSerializer.Serialize(new[]
        {
            new
            {
                id = "section-1",
                type = "section",
                layout = "1-col",
                styles = new { },
                columns = new[]
                {
                    new
                    {
                        id = "col-1",
                        span = new { mobile = 12, tablet = 12, desktop = 12 },
                        widgets = new object[] { }
                    }
                }
            }
        }, JsonOptions);

        var pages = new List<Page>
        {
            new()
            {
                Id = PageIds.Home,
                BrandId = BrandIds.Brand1,
                Name = "Home",
                Uri = "/",
                IsDynamic = false,
                Status = PageStatus.Published,
                Seo = new PageSeo
                {
                    Title = "Sample Brand - Discover Your Next Adventure",
                    Description = "Explore the world's most beautiful destinations with Sample Brand",
                    Keywords = ["travel", "luxury", "destinations", "vacation"]
                },
                LayoutId = LayoutIds.Default,
                BodyContent = homeBodyContent,
                ThemeId = ThemeIds.Simple,
                Version = "1.0.0",
                DraftRevisionId = RevisionIds.HomeDraft,
                PublishedRevisionId = RevisionIds.HomePublished,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                PublishedAt = new DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                CreatedBy = UserIds.Admin,
                UpdatedBy = UserIds.Admin
            },
        };

        await _context.Pages.AddRangeAsync(pages);
        await _context.SaveChangesAsync();

        // Add page revisions
        var revisions = new List<PageRevision>
        {
            new()
            {
                Id = RevisionIds.HomeDraft,
                PageId = PageIds.Home,
                LayoutData = homeBodyContent,
                Seo = new PageSeo
                {
                    Title = "Sample Brand - Discover Your Next Adventure",
                    Description = "Explore the world's most beautiful destinations with Sample Brand",
                    Keywords = ["travel", "luxury", "destinations", "vacation"]
                },
                ThemeId = ThemeIds.Simple,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                CreatedBy = UserIds.Admin
            },
            new()
            {
                Id = RevisionIds.HomePublished,
                PageId = PageIds.Home,
                LayoutData = homeBodyContent,
                Seo = new PageSeo
                {
                    Title = "Sample Brand - Discover Your Next Adventure",
                    Description = "Explore the world's most beautiful destinations with Sample Brand",
                    Keywords = ["travel", "luxury", "destinations", "vacation"]
                },
                ThemeId = ThemeIds.Simple,
                CreatedAt = new DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                CreatedBy = UserIds.Admin
            }
        };

        await _context.PageRevisions.AddRangeAsync(revisions);
        await _context.SaveChangesAsync();
    }

    private async Task SeedPageDataConfigsAsync()
    {
        var homeVariables = JsonSerializer.Serialize(new[]
        {
            new { name = "BRAND_ID", value = BrandIds.Brand1.ToString(), source = "static" },
            new { name = "FEATURED_COUNT", value = "6", source = "static" }
        }, JsonOptions);

        var homeApiCalls = JsonSerializer.Serialize(new object[]
        {
            new
            {
                id = "api-1", name = "Get Featured Packages", endpoint = "/api/packages/featured", method = "GET",
                headers = new { XBrandId = "{{BRAND_ID}}" }, @params = new { limit = "{{FEATURED_COUNT}}" }
            },
            new
            {
                id = "api-2", name = "Get Destinations", endpoint = "/api/destinations", method = "GET",
                @params = new { featured = "true" }
            },
            new
            {
                id = "api-destinations", name = "Get Featured Destinations", endpoint = "/api/destinations/featured",
                method = "GET", headers = new { XBrandId = "{{BRAND_ID}}" }, @params = new { limit = "8" }
            },
            new
            {
                id = "api-gallery-images", name = "Get Gallery Images", endpoint = "/api/gallery/featured",
                method = "GET", @params = new { collection = "travel", limit = "12" }
            },
            new
            {
                id = "api-faq-items", name = "Get FAQ Items", endpoint = "/api/faq/general", method = "GET",
                @params = new { category = "general" }
            }
        }, JsonOptions);

        var pageDataConfigs = new List<PageDataConfig>
        {
            new()
            {
                Id = PageDataConfigIds.Home,
                PageId = PageIds.Home,
                Variables = homeVariables,
                ApiCalls = homeApiCalls
            }
        };

        await _context.PageDataConfigs.AddRangeAsync(pageDataConfigs);
        await _context.SaveChangesAsync();
    }

    private async Task SeedTemplatesAsync()
    {
        var basicLandingContent = JsonSerializer.Serialize(new object[]
        {
            new
            {
                id = "tpl-section-1", type = "section", layout = "1-col", styles = new { },
                columns = new[]
                {
                    new
                    {
                        id = "tpl-col-1", span = new { mobile = 12, tablet = 12, desktop = 12 },
                        widgets = new object[] { }
                    }
                }
            },
            new
            {
                id = "tpl-section-2", type = "section", layout = "1-col", styles = new { },
                columns = new[]
                {
                    new
                    {
                        id = "tpl-col-2", span = new { mobile = 12, tablet = 12, desktop = 12 },
                        widgets = new object[] { }
                    }
                }
            },
            new
            {
                id = "tpl-section-3", type = "section", layout = "1-col", styles = new { },
                columns = new[]
                {
                    new
                    {
                        id = "tpl-col-3", span = new { mobile = 12, tablet = 12, desktop = 12 },
                        widgets = new[]
                        {
                            new
                            {
                                id = "tpl-4", widgetDefinitionId = "50000000-0000-0000-0000-00000000001b", config = new { },
                                styles = new { padding = "lg" }, order = 0, isVisible = true
                            }
                        }
                    }
                }
            }
        }, JsonOptions);

        var productListingContent = JsonSerializer.Serialize(new object[]
        {
            new
            {
                id = "tpl-section-5", type = "section", layout = "1-col", styles = new { },
                columns = new object[]
                {
                    new
                    {
                        id = "tpl-col-5", span = new { mobile = 12, tablet = 12, desktop = 12 },
                        widgets = new object[] { }
                    }
                }
            }
        }, JsonOptions);

        var faqPageContent = JsonSerializer.Serialize(new object[]
        {
            new
            {
                id = "tpl-section-12", type = "section", layout = "1-col", styles = new { },
                columns = new object[]
                {
                    new
                    {
                        id = "tpl-col-13", span = new { mobile = 12, tablet = 12, desktop = 12 },
                        widgets = new object[] { }
                    }
                }
            },
            new
            {
                id = "tpl-section-13", type = "section", layout = "1-col", styles = new { },
                columns = new object[]
                {
                    new
                    {
                        id = "tpl-col-14", span = new { mobile = 12, tablet = 12, desktop = 12 },
                        widgets = new object[]
                        {
                            new
                            {
                                id = "tpl-23", widgetDefinitionId = "50000000-0000-0000-0000-00000000000c", config = new { },
                                styles = new { padding = "lg" }, order = 0, isVisible = true
                            }
                        }
                    }
                }
            },
            new
            {
                id = "tpl-section-14", type = "section", layout = "1-col", styles = new { },
                columns = new object[]
                {
                    new
                    {
                        id = "tpl-col-15", span = new { mobile = 12, tablet = 12, desktop = 12 },
                        widgets = new object[]
                        {
                            new
                            {
                                id = "tpl-24", widgetDefinitionId = "50000000-0000-0000-0000-00000000001b",
                                config = new { heading = "Still have questions?" }, styles = new { padding = "lg" },
                                order = 0, isVisible = true
                            }
                        }
                    }
                }
            }
        }, JsonOptions);

        var templates = new List<Template>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Blank Page",
                Description = "Start with a blank canvas",
                Thumbnail = "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=300&h=200&fit=crop",
                BodyContent = "[]",
                Category = "Basic",
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                CreatedBy = UserIds.Admin
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Basic Landing Page",
                Description = "A simple landing page with hero, content, and footer",
                Thumbnail = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop",
                BodyContent = basicLandingContent,
                Category = "Marketing",
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                CreatedBy = UserIds.Admin
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Product Listing",
                Description = "Page template for displaying product/package listings with search",
                Thumbnail = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop",
                BodyContent = productListingContent,
                Category = "E-Commerce",
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                CreatedBy = UserIds.Admin
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "FAQ Page",
                Description = "Frequently asked questions page",
                Thumbnail = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop",
                BodyContent = faqPageContent,
                Category = "Support",
                CreatedAt = new DateTime(2024, 1, 10, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024, 1, 10, 0, 0, 0, DateTimeKind.Utc),
                CreatedBy = UserIds.Admin
            },
        };

        await _context.Templates.AddRangeAsync(templates);
        await _context.SaveChangesAsync();
    }

    private async Task SeedMediaItemsAsync()
    {
        var mediaItems = new List<MediaItem>
        {
            new()
            {
                Id = Guid.NewGuid(), Name = "luxury-hotel.jpg",
                Url = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop",
                Thumbnail = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=150&fit=crop",
                Type = MediaType.Image, Size = 156000, BrandId = BrandIds.Brand1, Folder = "properties",
                Alt = "Luxury hotel property", UploadedBy = UserIds.ContentEditor,
                UploadedAt = new DateTime(2024, 1, 18, 0, 0, 0, DateTimeKind.Utc),
                StorageProvider = MediaStorageProvider.External,
            },
            new()
            {
                Id = Guid.NewGuid(), Name = "logo-sample-brand.png",
                Url = "https://api.dicebear.com/7.x/initials/svg?seed=TL&backgroundColor=0891b2&size=200",
                Thumbnail = "https://api.dicebear.com/7.x/initials/svg?seed=TL&backgroundColor=0891b2&size=100",
                Type = MediaType.Image, Size = 12000, BrandId = BrandIds.Brand1, Folder = "logos",
                Alt = "Sample brand logo", UploadedBy = UserIds.Admin,
                UploadedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                StorageProvider = MediaStorageProvider.External,
            },
        };

        await _context.MediaItems.AddRangeAsync(mediaItems);
        await _context.SaveChangesAsync();
    }

    private async Task SeedRedirectsAsync()
    {
        var redirects = new List<Redirect>
        {
            new()
            {
                Id = Guid.NewGuid(), From = "/destinations-old", To = "/destinations", BrandId = BrandIds.Brand1,
                Status = RedirectStatus.MovedPermanently,
                CreatedAt = new DateTime(2024, 1, 10, 0, 0, 0, DateTimeKind.Utc)
            },
        };

        await _context.Redirects.AddRangeAsync(redirects);
        await _context.SaveChangesAsync();
    }

    private async Task SeedAuditLogsAsync()
    {
        var logs = new List<AuditLog>
        {
            new()
            {
                Id = Guid.NewGuid(), UserId = UserIds.ContentEditor, Action = "page.created",
                EntityType = AuditEntityType.Page, EntityId = PageIds.Home,
                Details = JsonSerializer.Serialize(new { pageName = "Homepage", uri = "/" }, JsonOptions),
                CreatedAt = new DateTime(2024, 1, 15, 9, 30, 0, DateTimeKind.Utc)
            },
            new()
            {
                Id = Guid.NewGuid(), UserId = UserIds.ContentEditor, Action = "page.published",
                EntityType = AuditEntityType.Page, EntityId = PageIds.Home,
                Details = JsonSerializer.Serialize(new { pageName = "Homepage" }, JsonOptions),
                CreatedAt = new DateTime(2024, 2, 1, 14, 22, 0, DateTimeKind.Utc)
            },
            new()
            {
                Id = Guid.NewGuid(), UserId = UserIds.ContentEditor, Action = "widget.added",
                EntityType = AuditEntityType.Page, EntityId = PageIds.Home,
                Details = JsonSerializer.Serialize(new { widgetName = "Hero Banner", pageId = PageIds.Home },
                    JsonOptions),
                CreatedAt = new DateTime(2024, 1, 15, 10, 15, 0, DateTimeKind.Utc)
            },
            new()
            {
                Id = Guid.NewGuid(), UserId = UserIds.Admin, Action = "template.created",
                EntityType = AuditEntityType.Template, EntityId = Guid.Empty,
                Details = JsonSerializer.Serialize(new { templateName = "Basic Landing Page" }, JsonOptions),
                CreatedAt = new DateTime(2024, 1, 1, 8, 0, 0, DateTimeKind.Utc)
            },
            new()
            {
                Id = Guid.NewGuid(), UserId = UserIds.ContentEditor, Action = "page.updated",
                EntityType = AuditEntityType.Page, EntityId = PageIds.Home,
                Details = JsonSerializer.Serialize(new { changes = new[] { "SEO updated", "Hero title changed" } },
                    JsonOptions),
                CreatedAt = new DateTime(2024, 2, 5, 16, 45, 0, DateTimeKind.Utc)
            },
            new()
            {
                Id = Guid.NewGuid(), UserId = UserIds.Admin, Action = "user.created", EntityType = AuditEntityType.User,
                EntityId = UserIds.Sarah,
                Details =
                    JsonSerializer.Serialize(new { userName = "Sarah Jones", role = "content_team" }, JsonOptions),
                CreatedAt = new DateTime(2024, 2, 15, 10, 0, 0, DateTimeKind.Utc)
            },
        };

        await _context.AuditLogs.AddRangeAsync(logs);
        await _context.SaveChangesAsync();
    }

    // Mock data seeding methods
    private async Task SeedGalleryImagesAsync()
    {
        var images = new List<GalleryImage>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Src = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
                Alt = "Mountain landscape", Caption = "Majestic mountain peaks"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop",
                Alt = "Alpine scenery", Caption = "Beautiful alpine views"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Src = "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop",
                Alt = "City skyline", Caption = "Urban exploration"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Src = "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop",
                Alt = "Resort pool", Caption = "Luxury resort experience"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Src = "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&h=600&fit=crop",
                Alt = "Beach sunset", Caption = "Tropical paradise"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Src = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop",
                Alt = "Nature path", Caption = "Nature trails"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop",
                Alt = "Beach view", Caption = "Crystal clear waters"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Src = "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&h=600&fit=crop",
                Alt = "Desert landscape", Caption = "Desert adventure"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Src = "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=600&fit=crop",
                Alt = "Forest trail", Caption = "Forest exploration"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Src = "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop",
                Alt = "Coastal view", Caption = "Coastal beauty"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Src = "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop",
                Alt = "Mountain lake", Caption = "Serene mountain lake"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Src = "https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=600&fit=crop",
                Alt = "Tropical island", Caption = "Island getaway"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Src = "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop",
                Alt = "Mountain range", Caption = "Panoramic mountain views"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Src = "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop",
                Alt = "Valley view", Caption = "Scenic valley"
            },
            new()
            {
                Id = Guid.NewGuid(),
                Src = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop",
                Alt = "Ocean view", Caption = "Ocean horizons"
            },
        };

        await _context.GalleryImages.AddRangeAsync(images);
        await _context.SaveChangesAsync();
    }

    private async Task SeedDestinationsAsync()
    {
        var destinations = new List<Destination>
        {
            new()
            {
                Id = Guid.NewGuid(), Title = "Tropical Paradise",
                Description =
                    "Experience the ultimate beach getaway with pristine white sands and crystal-clear waters",
                Price = "$1,299", Rating = 4.8m,
                Image = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
                Link = "/destinations/tropical-paradise"
            },
            new()
            {
                Id = Guid.NewGuid(), Title = "Mountain Adventure",
                Description = "Explore breathtaking peaks and alpine landscapes perfect for hiking enthusiasts",
                Price = "$899", Rating = 4.9m,
                Image = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
                Link = "/destinations/mountain-adventure"
            },
            new()
            {
                Id = Guid.NewGuid(), Title = "City Escape",
                Description = "Discover vibrant urban culture, world-class dining, and iconic landmarks",
                Price = "$599", Rating = 4.7m,
                Image = "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop",
                Link = "/destinations/city-escape"
            },
            new()
            {
                Id = Guid.NewGuid(), Title = "Beach Resort",
                Description = "Luxury beachfront accommodation with premium amenities and stunning ocean views",
                Price = "$1,499", Rating = 4.9m,
                Image = "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop",
                Link = "/destinations/beach-resort"
            },
            new()
            {
                Id = Guid.NewGuid(), Title = "Desert Oasis",
                Description = "Unique desert experience with luxury camping and stargazing opportunities",
                Price = "$1,199", Rating = 4.6m,
                Image = "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=300&fit=crop",
                Link = "/destinations/desert-oasis"
            },
            new()
            {
                Id = Guid.NewGuid(), Title = "Forest Retreat",
                Description = "Peaceful woodland escape surrounded by nature and wildlife", Price = "$799",
                Rating = 4.8m,
                Image = "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop",
                Link = "/destinations/forest-retreat"
            },
            new()
            {
                Id = Guid.NewGuid(), Title = "Coastal Haven",
                Description = "Charming coastal town with historic architecture and fresh seafood", Price = "$999",
                Rating = 4.7m,
                Image = "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=300&fit=crop",
                Link = "/destinations/coastal-haven"
            },
            new()
            {
                Id = Guid.NewGuid(), Title = "Island Getaway",
                Description = "Exotic island destination with tropical vibes and adventure activities",
                Price = "$1,399", Rating = 4.9m,
                Image = "https://images.unsplash.com/photo-1511497584788-876760111969?w=400&h=300&fit=crop",
                Link = "/destinations/island-getaway"
            },
            new()
            {
                Id = Guid.NewGuid(), Title = "Alpine Wonderland",
                Description = "Winter sports paradise with world-class skiing and mountain views", Price = "$1,599",
                Rating = 4.9m,
                Image = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop",
                Link = "/destinations/alpine-wonderland"
            },
            new()
            {
                Id = Guid.NewGuid(), Title = "Cultural Journey",
                Description = "Immerse yourself in rich history, art, and local traditions", Price = "$1,099",
                Rating = 4.8m,
                Image = "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop",
                Link = "/destinations/cultural-journey"
            },
        };

        await _context.Destinations.AddRangeAsync(destinations);
        await _context.SaveChangesAsync();
    }


    private async Task SeedFaqItemsAsync()
    {
        var faqs = new List<FaqItem>
        {
            new()
            {
                Id = Guid.NewGuid(), Question = "What services do you offer?",
                Answer =
                    "We offer a wide range of services including design, development, and marketing solutions tailored to your needs. Our comprehensive service portfolio covers everything from initial consultation to ongoing support and maintenance."
            },
            new()
            {
                Id = Guid.NewGuid(), Question = "How can I get started?",
                Answer =
                    "Simply contact us through our form or give us a call. We'll schedule a free consultation to discuss your project. During this consultation, we'll understand your requirements, timeline, and budget to create a customized solution for you."
            },
            new()
            {
                Id = Guid.NewGuid(), Question = "What are your pricing options?",
                Answer =
                    "Our pricing is flexible and based on the scope of your project. We offer packages for businesses of all sizes, from startups to large enterprises. Contact us for a personalized quote that fits your budget and requirements."
            },
            new()
            {
                Id = Guid.NewGuid(), Question = "What is your typical response time for support?",
                Answer =
                    "We aim to respond to all support inquiries within 24 hours during business days. For urgent matters, we offer priority support with same-day response times. Enterprise customers receive dedicated support with guaranteed response times."
            },
            new()
            {
                Id = Guid.NewGuid(), Question = "Can I customize the solutions to fit my specific needs?",
                Answer =
                    "Absolutely! All our solutions are fully customizable. We work closely with you to understand your requirements and tailor our services to match your unique business needs and goals. Our team specializes in creating bespoke solutions."
            },
            new()
            {
                Id = Guid.NewGuid(), Question = "What is your refund or cancellation policy?",
                Answer =
                    "We offer a 30-day money-back guarantee on all our services. If you're not satisfied with our work, we'll refund your payment. Cancellations can be made at any time with 30 days notice. Please review our terms of service for complete details."
            },
            new()
            {
                Id = Guid.NewGuid(), Question = "What are the technical requirements to use your services?",
                Answer =
                    "Our services are designed to work with modern web browsers and don't require any special technical setup on your end. We handle all the technical implementation and provide you with easy-to-use interfaces. No coding knowledge required!"
            },
            new()
            {
                Id = Guid.NewGuid(), Question = "Do your solutions integrate with other platforms and tools?",
                Answer =
                    "Yes! We offer integrations with popular platforms including CRM systems, payment processors, email marketing tools, and analytics platforms. We can also build custom integrations for your specific needs. Our API-first approach ensures seamless connectivity."
            },
            new()
            {
                Id = Guid.NewGuid(), Question = "How do I track the progress of my project?",
                Answer =
                    "You'll have access to a dedicated project dashboard where you can track progress, view milestones, and communicate with the team. We also provide regular updates via email and scheduled check-in calls to keep you informed every step of the way."
            },
            new()
            {
                Id = Guid.NewGuid(), Question = "What kind of training or documentation do you provide?",
                Answer =
                    "We provide comprehensive documentation, video tutorials, and live training sessions to help you get the most out of our solutions. Enterprise customers receive personalized training programs tailored to their team's needs."
            },
        };

        await _context.FaqItems.AddRangeAsync(faqs);
        await _context.SaveChangesAsync();
    }

    private async Task SeedTravelPackagesAsync()
    {
        var packages = new List<TravelPackage>
        {
            new()
            {
                Id = Guid.NewGuid(), Name = "Tropical Paradise Package",
                Description = "7 days in a luxury beachfront resort with all-inclusive meals", Price = "$1,299",
                Duration = "7 days",
                Image = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
                Rating = 4.8m, Location = "Maldives"
            },
            new()
            {
                Id = Guid.NewGuid(), Name = "Mountain Adventure Package",
                Description = "5 days of hiking and exploration in the Alps", Price = "$899", Duration = "5 days",
                Image = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
                Rating = 4.9m, Location = "Switzerland"
            },
            new()
            {
                Id = Guid.NewGuid(), Name = "City Explorer Package",
                Description = "4 days discovering European capitals", Price = "$599", Duration = "4 days",
                Image = "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop",
                Rating = 4.7m, Location = "Paris"
            },
            new()
            {
                Id = Guid.NewGuid(), Name = "Desert Safari Package",
                Description = "3 days of desert adventure and luxury camping", Price = "$799", Duration = "3 days",
                Image = "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=300&fit=crop",
                Rating = 4.6m, Location = "Dubai"
            },
            new()
            {
                Id = Guid.NewGuid(), Name = "Island Hopping Package",
                Description = "10 days exploring multiple tropical islands", Price = "$1,599", Duration = "10 days",
                Image = "https://images.unsplash.com/photo-1511497584788-876760111969?w=400&h=300&fit=crop",
                Rating = 4.9m, Location = "Caribbean"
            },
            new()
            {
                Id = Guid.NewGuid(), Name = "Cultural Heritage Package",
                Description = "6 days immersing in rich history and traditions", Price = "$1,099", Duration = "6 days",
                Image = "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop",
                Rating = 4.8m, Location = "Japan"
            },
        };

        await _context.TravelPackages.AddRangeAsync(packages);
        await _context.SaveChangesAsync();
    }

    private async Task SeedSimpleDestinationsAsync()
    {
        var destinations = new List<SimpleDestination>
        {
            new() { Id = Guid.NewGuid(), Name = "Bali, Indonesia", Type = "beach", Featured = true },
            new() { Id = Guid.NewGuid(), Name = "Paris, France", Type = "city", Featured = true },
            new() { Id = Guid.NewGuid(), Name = "Tokyo, Japan", Type = "city", Featured = true },
            new() { Id = Guid.NewGuid(), Name = "Santorini, Greece", Type = "beach", Featured = true },
            new() { Id = Guid.NewGuid(), Name = "New York, USA", Type = "city", Featured = false },
            new() { Id = Guid.NewGuid(), Name = "Dubai, UAE", Type = "desert", Featured = true },
            new() { Id = Guid.NewGuid(), Name = "London, UK", Type = "city", Featured = false },
            new() { Id = Guid.NewGuid(), Name = "Maldives", Type = "beach", Featured = true },
            new() { Id = Guid.NewGuid(), Name = "Switzerland", Type = "mountain", Featured = true },
            new() { Id = Guid.NewGuid(), Name = "Thailand", Type = "beach", Featured = false },
        };

        await _context.SimpleDestinations.AddRangeAsync(destinations);
        await _context.SaveChangesAsync();
    }

}
