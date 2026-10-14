namespace Cms.Application.DTOs.Brands.Responses;

public sealed record BrandDto(
    Guid Id,
    string Name,
    string Domain,
    string? Subdomain,
    string? Logo,
    string PrimaryColor,
    string SecondaryColor,
    string? GlobalCss,
    List<string> CustomFontUrls,
    DateTime CreatedAt,
    DateTime UpdatedAt);

