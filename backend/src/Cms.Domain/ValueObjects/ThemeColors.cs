namespace Cms.Domain.ValueObjects;

/// <summary>
/// Color scheme for a theme.
/// </summary>
public sealed record ThemeColors
{
    public string Primary { get; init; } = "#0891b2";
    public string Secondary { get; init; } = "#164e63";
    public string Background { get; init; } = "#ffffff";
    public string Text { get; init; } = "#1f2937";
    public string Accent { get; init; } = "#06b6d4";
}

