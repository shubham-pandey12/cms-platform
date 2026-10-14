using Microsoft.AspNetCore.Http;

namespace Cms.Application.DTOs.Media.Requests;

/// <summary>
/// Form-data payload for uploading a media item.
/// </summary>
public sealed class UploadMediaRequest
{
    public IFormFile? File { get; set; }

    public Guid BrandId { get; set; }

    public string? Folder { get; set; }

    public string? Alt { get; set; }

    /// <summary>
    /// Optional stored format for raster images: <c>original</c> or <c>webp</c>.
    /// SVG and animated GIF are always stored as uploaded.
    /// </summary>
    public string? OutputFormat { get; set; }
}
