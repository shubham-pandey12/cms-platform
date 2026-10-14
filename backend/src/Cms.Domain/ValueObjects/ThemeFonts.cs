namespace Cms.Domain.ValueObjects;

/// <summary>
/// Font family configuration for a theme.
/// </summary>
public sealed record ThemeFonts
{
    public string Heading { get; init; } = "Inter";
    public string Body { get; init; } = "Inter";
}

