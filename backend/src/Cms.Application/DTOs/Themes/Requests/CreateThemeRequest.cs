using Cms.Application.DTOs.Themes.Responses;

namespace Cms.Application.DTOs.Themes.Requests;

public sealed record CreateThemeRequest(
    string Name,
    ThemeColorsDto Colors,
    ThemeFontsDto Fonts,
    FontConfigDto? HeadingFontConfig,
    FontConfigDto? BodyFontConfig,
    Guid? BrandId);

