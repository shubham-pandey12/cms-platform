using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Cms.Application.Common.Interfaces;
using Cms.Application.Interfaces.Services;
using Cms.Application.Services.AuditLogs;
using Cms.Application.Services.Auth;
using Cms.Application.Services.Brands;
using Cms.Application.Services.Infrastructure;
using Cms.Application.Services.Media;
using Cms.Application.Services.MockData;
using Cms.Application.Services.PageData;
using Cms.Application.Services.Pages;
using Cms.Application.Services.SiteLayouts;
using Cms.Application.Services.Redirects;
using Cms.Application.Services.SiteSettings;
using Cms.Application.Services.Security;
using Cms.Application.Services.Templates;
using Cms.Application.Services.Themes;
using Cms.Application.Services.Users;
using Cms.Application.Services.Widgets;

namespace Cms.Application;

/// <summary>
/// Dependency injection extensions for the Application layer.
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Adds application services including validators.
    /// </summary>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        // Register infrastructure services
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<ICurrentUser, CurrentUser>();

        // Register application services
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IPageService, PageService>();
        services.AddScoped<IPageDataService, PageDataService>();
        services.AddScoped<IBrandService, BrandService>();
        services.AddScoped<IWidgetService, WidgetService>();
        services.AddScoped<IMediaService, MediaService>();
        services.AddScoped<IMockDataService, MockDataService>();
        services.AddScoped<ITemplateService, TemplateService>();
        services.AddScoped<IThemeService, ThemeService>();
        services.AddScoped<ISiteLayoutService, SiteLayoutService>();
        services.AddScoped<ISiteSettingsService, SiteSettingsService>();
        services.AddScoped<IRedirectService, RedirectService>();
        services.AddScoped<IRoleService, RoleService>();
        services.AddScoped<IUserAssignmentService, UserAssignmentService>();
        services.AddScoped<IPermissionResolver, PermissionResolver>();

        return services;
    }
}

