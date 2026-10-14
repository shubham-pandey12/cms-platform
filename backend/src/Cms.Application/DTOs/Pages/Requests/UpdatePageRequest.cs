using Cms.Application.DTOs.Pages.Responses;

namespace Cms.Application.DTOs.Pages.Requests;

public sealed record UpdatePageRequest(
    string? Name,
    string? Uri,
    bool? IsDynamic,
    List<string>? DynamicVariables,
    PageSeoDto? Seo,
    string? BodyContent,
    Guid? ThemeId,
    string? LayoutConfigJson,
    string? CustomCss);

