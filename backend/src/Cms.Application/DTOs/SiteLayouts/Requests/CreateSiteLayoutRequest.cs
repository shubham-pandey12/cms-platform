namespace Cms.Application.DTOs.SiteLayouts.Requests;

public sealed record CreateSiteLayoutRequest(
    Guid BrandId,
    string Name,
    string Header,
    string Footer,
    string? Sidebar,
    bool IsDefault = false);

