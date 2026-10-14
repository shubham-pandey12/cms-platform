using Cms.Application.DTOs.Pages.Responses;

namespace Cms.Application.DTOs.Pages.Requests;

public sealed record CreatePageRequest(
    Guid BrandId,
    string Name,
    string Uri,
    bool IsDynamic,
    List<string>? DynamicVariables,
    PageSeoDto? Seo,
    Guid LayoutId,
    string? BodyContent,
    Guid? ThemeId);

