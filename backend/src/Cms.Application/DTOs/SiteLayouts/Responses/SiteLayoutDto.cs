namespace Cms.Application.DTOs.SiteLayouts.Responses;

public sealed record SiteLayoutDto(
    Guid Id,
    Guid BrandId,
    string Name,
    bool IsDefault,
    string Header,
    string Footer,
    string? Sidebar,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    Guid CreatedBy,
    Guid UpdatedBy);

