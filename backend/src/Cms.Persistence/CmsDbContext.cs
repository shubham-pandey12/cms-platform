using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Cms.Domain.Entities;
using Cms.Domain.Entities.MockData;

namespace Cms.Persistence;

/// <summary>
/// Entity Framework Core database context for the CMS.
/// </summary>
public sealed class CmsDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public CmsDbContext(DbContextOptions<CmsDbContext> options) : base(options)
    {
    }

    // Core CMS entities
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<BrandDomain> BrandDomains => Set<BrandDomain>();
    public DbSet<Page> Pages => Set<Page>();
    public DbSet<PageRevision> PageRevisions => Set<PageRevision>();
    public DbSet<WidgetDefinition> WidgetDefinitions => Set<WidgetDefinition>();
    public DbSet<WidgetDefinitionVersion> WidgetDefinitionVersions => Set<WidgetDefinitionVersion>();
    public DbSet<Template> Templates => Set<Template>();
    public DbSet<MediaItem> MediaItems => Set<MediaItem>();
    public DbSet<Redirect> Redirects => Set<Redirect>();
    public DbSet<SiteLayout> SiteLayouts => Set<SiteLayout>();
    public DbSet<SiteSettings> SiteSettings => Set<SiteSettings>();
    public DbSet<Theme> Themes => Set<Theme>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<PageDataConfig> PageDataConfigs => Set<PageDataConfig>();
    public DbSet<WidgetCategoryDefinition> WidgetCategories => Set<WidgetCategoryDefinition>();
    public DbSet<RoleDefinition> RoleDefinitions => Set<RoleDefinition>();
    public DbSet<PermissionDefinition> PermissionDefinitions => Set<PermissionDefinition>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserRoleAssignment> UserRoleAssignments => Set<UserRoleAssignment>();

    // Mock data entities for widgets
    public DbSet<GalleryImage> GalleryImages => Set<GalleryImage>();
    public DbSet<Destination> Destinations => Set<Destination>();
    public DbSet<FaqItem> FaqItems => Set<FaqItem>();
    public DbSet<TravelPackage> TravelPackages => Set<TravelPackage>();
    public DbSet<SimpleDestination> SimpleDestinations => Set<SimpleDestination>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all configurations from the assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CmsDbContext).Assembly);

        // Configure Identity tables with cms schema
        modelBuilder.Entity<ApplicationUser>().ToTable("users", "cms");
        modelBuilder.Entity<IdentityRole<Guid>>().ToTable("roles", "cms");
        modelBuilder.Entity<IdentityUserRole<Guid>>().ToTable("user_roles", "cms");
        modelBuilder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims", "cms");
        modelBuilder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins", "cms");
        modelBuilder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens", "cms");
        modelBuilder.Entity<IdentityRoleClaim<Guid>>().ToTable("role_claims", "cms");
    }
}

