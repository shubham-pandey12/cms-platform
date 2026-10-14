namespace Cms.Application.DTOs.Brands.Requests;

public sealed record UpdateBrandRequest(
    string? Name,
    string? Domain,
    string? Subdomain,
    string? Logo,
    string? PrimaryColor,
    string? SecondaryColor,
    string? GlobalCss,
    List<string>? CustomFontUrls);

