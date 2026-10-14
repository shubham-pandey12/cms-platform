namespace Cms.Domain.Entities.MockData;

/// <summary>
/// Image for gallery widget.
/// </summary>
public sealed class GalleryImage
{
    public Guid Id { get; set; }
    public string Src { get; set; } = string.Empty;
    public string Alt { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
}

