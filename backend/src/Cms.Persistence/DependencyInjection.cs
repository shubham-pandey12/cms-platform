using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Repositories.MockData;
using Cms.Domain.Entities;
using Cms.Persistence.Repositories;
using Cms.Persistence.Repositories.MockData;

namespace Cms.Persistence;

/// <summary>
/// Dependency injection extensions for the Persistence layer.
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Adds the database context and Identity services.
    /// </summary>
    public static IHostApplicationBuilder AddPersistence(this IHostApplicationBuilder builder)
    {
        builder.AddNpgsqlDbContext<CmsDbContext>("cmsdb");

        builder.Services.AddIdentityCore<ApplicationUser>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequiredLength = 8;

            options.User.RequireUniqueEmail = true;
            options.SignIn.RequireConfirmedEmail = false;
        })
        .AddRoles<IdentityRole<Guid>>()
        .AddEntityFrameworkStores<CmsDbContext>()
        .AddSignInManager()
        .AddDefaultTokenProviders();

        // Register repositories
        builder.Services.AddScoped<IPageRepository, PageRepository>();
        builder.Services.AddScoped<IBrandRepository, BrandRepository>();
        builder.Services.AddScoped<IBrandDomainRepository, BrandDomainRepository>();
        builder.Services.AddScoped<IWidgetRepository, WidgetRepository>();
        builder.Services.AddScoped<IMediaRepository, MediaRepository>();
        builder.Services.AddScoped<IPageRevisionRepository, PageRevisionRepository>();
        builder.Services.AddScoped<ISiteLayoutRepository, SiteLayoutRepository>();
        builder.Services.AddScoped<IThemeRepository, ThemeRepository>();
        builder.Services.AddScoped<ISiteSettingsRepository, SiteSettingsRepository>();
        builder.Services.AddScoped<ITemplateRepository, TemplateRepository>();
        builder.Services.AddScoped<IPageDataConfigRepository, PageDataConfigRepository>();
        builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        builder.Services.AddScoped<IGalleryImageRepository, GalleryImageRepository>();
        builder.Services.AddScoped<IDestinationRepository, DestinationRepository>();
        builder.Services.AddScoped<ISimpleDestinationRepository, SimpleDestinationRepository>();
        builder.Services.AddScoped<IFaqItemRepository, FaqItemRepository>();
        builder.Services.AddScoped<ITravelPackageRepository, TravelPackageRepository>();
        builder.Services.AddScoped<IRedirectRepository, RedirectRepository>();
        builder.Services.AddScoped<IRbacRepository, RbacRepository>();

        return builder;
    }

    /// <summary>
    /// Ensures the database is created and migrations are applied.
    /// </summary>
    public static async Task EnsureDatabaseCreatedAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CmsDbContext>();
        await dbContext.Database.MigrateAsync();
    }
}

