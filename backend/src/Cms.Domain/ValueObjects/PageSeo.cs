namespace Cms.Domain.ValueObjects;

/// <summary>
/// SEO configuration for a page.
/// </summary>
public sealed record PageSeo
{
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public List<string> Keywords { get; init; } = [];
    public string? CanonicalUrl { get; init; }
    public string? OgTitle { get; init; }
    public string? OgDescription { get; init; }
    public string? OgImage { get; init; }
    public string? TwitterCard { get; init; }
    public string? TwitterTitle { get; init; }
    public string? TwitterDescription { get; init; }
    public string? TwitterImage { get; init; }
    public bool NoIndex { get; init; }
    public bool NoFollow { get; init; }
}

