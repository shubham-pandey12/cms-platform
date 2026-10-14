namespace Cms.Application.Options;

/// <summary>
/// Configuration for public media URLs (e.g. behind a reverse proxy).
/// </summary>
public sealed class MediaOptions
{
    public const string SectionName = "Media";

    /// <summary>
    /// When set, used as the base for <see cref="Cms.Domain.Entities.MediaItem.Url"/> instead of the incoming request host.
    /// Example: https://api.example.com
    /// </summary>
    public string? PublicBaseUrl { get; set; }

    /// <summary>
    /// WebP encoder quality (1–100) when the upload requests WebP output.
    /// </summary>
    public int WebpQuality { get; set; } = 85;
}
