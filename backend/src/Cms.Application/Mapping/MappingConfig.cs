using Mapster;
using Cms.Application.DTOs.AuditLogs;
using Cms.Application.DTOs.Brands.Responses;
using Cms.Application.DTOs.Redirects;
using Cms.Application.DTOs.Media.Responses;
using Cms.Application.DTOs.Pages.Responses;
using Cms.Application.DTOs.SiteLayouts.Responses;
using Cms.Application.DTOs.Templates.Responses;
using Cms.Application.DTOs.Widgets.Responses;
using Cms.Domain.Entities;
using Cms.Domain.ValueObjects;

namespace Cms.Application.Mapping;

/// <summary>
/// Central Mapster configuration for Entity to DTO mappings.
/// </summary>
public static class MappingConfig
{
    /// <summary>
    /// Registers all entity-to-DTO mappings. Call once at application startup.
    /// </summary>
    public static void Register()
    {
        TypeAdapterConfig<Page, PageDto>.NewConfig()
            .Map(d => d.RouteParams, _ => (Dictionary<string, string>?)null);

        TypeAdapterConfig<Brand, BrandDto>.NewConfig();
        TypeAdapterConfig<MediaItem, MediaItemDto>.NewConfig();
        TypeAdapterConfig<WidgetDefinition, WidgetDefinitionDto>.NewConfig();
        TypeAdapterConfig<Template, TemplateDto>.NewConfig();
        TypeAdapterConfig<AuditLog, AuditLogDto>.NewConfig();
        TypeAdapterConfig<SiteLayout, SiteLayoutDto>.NewConfig();
        TypeAdapterConfig<Redirect, RedirectDto>.NewConfig();
    }
}
