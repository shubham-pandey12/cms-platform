namespace Cms.Application.DTOs.Media.Responses;

/// <summary>
/// Result of resolving binary content for GET api/media/&#123;id&#125;/file.
/// </summary>
public abstract record MediaFileResult
{
    public sealed record Found(byte[] Content, string ContentType) : MediaFileResult;

    public sealed record NotFound : MediaFileResult;

    /// <summary>
    /// External URLs are not streamed through this API; clients use <see cref="Cms.Domain.Entities.MediaItem.Url"/> directly.
    /// </summary>
    public sealed record ExternalNotStreamed : MediaFileResult;

    public sealed record BlobNotImplemented : MediaFileResult;
}
