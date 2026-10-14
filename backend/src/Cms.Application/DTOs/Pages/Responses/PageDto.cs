using Cms.Domain.Enums;

namespace Cms.Application.DTOs.Pages.Responses;

public sealed record PageDto(
    Guid Id,
    Guid BrandId,
    string Name,
    string Uri,
    bool IsDynamic,
    List<string> DynamicVariables,
    PageStatus Status,
    PageSeoDto Seo,
    Guid LayoutId,
    string BodyContent,
    Guid? ThemeId,
    string? LayoutConfigJson,
    string? CustomCss,
    string Version,
    Guid? PublishedRevisionId,
    Guid DraftRevisionId,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? PublishedAt,
    Guid CreatedBy,
    Guid UpdatedBy,
    Dictionary<string, string>? RouteParams);

/// <summary>
/// Summary of a page revision for listing (e.g. version history).
/// </summary>
public sealed record PageRevisionDto(
    Guid Id,
    Guid PageId,
    DateTime CreatedAt,
    Guid CreatedBy);

/// <summary>
/// Full content of a single revision for loading into the editor (e.g. edit older version).
/// </summary>
public sealed record PageRevisionDetailDto(
    Guid Id,
    Guid PageId,
    string BodyContent,
    PageSeoDto Seo,
    Guid? ThemeId,
    string? LayoutConfigJson,
    string? CustomCss,
    DateTime CreatedAt,
    Guid CreatedBy);

public sealed record PageSeoDto(
    string Title,
    string Description,
    List<string> Keywords,
    string? CanonicalUrl,
    string? OgTitle,
    string? OgDescription,
    string? OgImage,
    bool NoIndex,
    bool NoFollow);

