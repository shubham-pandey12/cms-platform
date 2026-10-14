using Cms.Domain.Enums;

namespace Cms.Domain.Entities;

/// <summary>
/// Represents a media file in the media library.
/// </summary>
public sealed class MediaItem
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Thumbnail { get; set; } = string.Empty;
    public MediaType Type { get; set; }
    public long Size { get; set; }
    public Guid BrandId { get; set; }
    public string Folder { get; set; } = string.Empty;
    public string? Alt { get; set; }
    public Guid UploadedBy { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public MediaStorageProvider StorageProvider { get; set; }

    /// <summary>
    /// Raw file bytes when <see cref="StorageProvider"/> is <see cref="MediaStorageProvider.Database"/>.
    /// </summary>
    public byte[]? Content { get; set; }

    public string? ContentType { get; set; }

    /// <summary>
    /// Reserved for object/blob storage (future).
    /// </summary>
    public string? BlobContainer { get; set; }

    /// <summary>
    /// Reserved for object/blob storage (future).
    /// </summary>
    public string? BlobKey { get; set; }

    // Navigation properties
    public Brand Brand { get; set; } = null!;
}

