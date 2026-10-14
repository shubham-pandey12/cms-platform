using Cms.Domain.Enums;

namespace Cms.Application.DTOs.Widgets.Responses;

public sealed record WidgetDefinitionDto(
    Guid Id,
    string Slug,
    string Name,
    WidgetCategory Category,
    string Description,
    string Icon,
    string Version,
    string? Thumbnail,
    string ConfigSchema,
    string DefaultConfig,
    WidgetStylesDto? DefaultStyles,
    List<Guid> BrandIds,
    bool IsAdvanced,
    bool SupportsHtmlEmbed,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record WidgetStylesDto(
    string? BackgroundColor,
    string? TextColor,
    string Padding,
    string Margin,
    int BorderRadius,
    int BorderWidth,
    string? BorderColor,
    string Shadow,
    int Opacity,
    string? TextAlign,
    string? CustomClasses);

