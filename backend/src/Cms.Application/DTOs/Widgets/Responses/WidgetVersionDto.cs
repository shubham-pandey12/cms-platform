namespace Cms.Application.DTOs.Widgets.Responses;

/// <summary>
/// Full details of a specific widget version.
/// </summary>
public sealed record WidgetVersionDto(
    Guid Id,
    string Slug,
    string Version,
    string Name,
    string Description,
    string ConfigSchema,
    string DefaultConfig,
    WidgetStylesDto? DefaultStyles,
    string? ChangeLog,
    bool IsLatest,
    bool IsDeprecated,
    DateTime CreatedAt);

/// <summary>
/// Summary version info for dropdowns and lists.
/// </summary>
public sealed record WidgetVersionListItemDto(
    Guid Id,
    string Version,
    string? ChangeLog,
    bool IsLatest,
    bool IsDeprecated,
    DateTime CreatedAt);
