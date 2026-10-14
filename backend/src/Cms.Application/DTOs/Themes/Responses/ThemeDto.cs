namespace Cms.Application.DTOs.Themes.Responses;

public sealed record ThemeDto(
    Guid Id,
    string Name,
    ThemeColorsDto Colors,
    ThemeFontsDto Fonts,
    FontConfigDto? HeadingFontConfig,
    FontConfigDto? BodyFontConfig,
    bool IsDefault,
    Guid? BrandId);

public sealed record ThemeColorsDto(
    string Primary,
    string Secondary,
    string Background,
    string Text,
    string Accent);

public sealed record ThemeFontsDto(
    string Heading,
    string Body);

public sealed record FontConfigDto(
    string Family,
    List<int> Weights,
    List<string> Fallbacks,
    string Source,
    string? Url);

