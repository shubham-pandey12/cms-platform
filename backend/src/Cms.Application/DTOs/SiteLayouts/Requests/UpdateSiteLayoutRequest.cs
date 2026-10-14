namespace Cms.Application.DTOs.SiteLayouts.Requests;

public sealed record UpdateSiteLayoutRequest(
    string? Name,
    bool? IsDefault,
    string? Header,
    string? Footer,
    string? Sidebar);

