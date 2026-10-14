using Cms.Application.DTOs.Themes.Responses;

namespace Cms.Application.DTOs.Themes.Requests;

public sealed record UpdateThemeRequest(
    string? Name,
    ThemeColorsDto? Colors,
    ThemeFontsDto? Fonts,
    FontConfigDto? HeadingFontConfig,
    FontConfigDto? BodyFontConfig);

