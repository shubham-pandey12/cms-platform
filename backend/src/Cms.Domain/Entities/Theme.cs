using Cms.Domain.ValueObjects;

namespace Cms.Domain.Entities;

/// <summary>
/// Represents a theme definition with colors, fonts, and styling.
/// </summary>
public sealed class Theme
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ThemeColors Colors { get; set; } = new();
    public ThemeFonts Fonts { get; set; } = new();
    public FontConfig? HeadingFontConfig { get; set; }
    public FontConfig? BodyFontConfig { get; set; }
    public bool IsDefault { get; set; }
    public Guid? BrandId { get; set; }

    // Navigation properties
    public Brand? Brand { get; set; }
}

