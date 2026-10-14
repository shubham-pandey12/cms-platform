namespace Cms.Application.DTOs.Brands.Requests;

public sealed record CreateBrandRequest(
    string Name,
    string Domain,
    string? Subdomain,
    string? Logo,
    string PrimaryColor,
    string SecondaryColor,
    string? GlobalCss,
    List<string>? CustomFontUrls,
    Guid? ThemeId = null,
    string? SiteName = null,
    string? SiteDescription = null,
    string? Favicon = null,
    string? LogoUrl = null,
    bool? ShowNavigation = null,
    string? NavigationPosition = null,
    string? NavigationStyle = null,
    bool? ShowLogo = null,
    bool? EnableSearch = null,
    string? CustomDomain = null);

