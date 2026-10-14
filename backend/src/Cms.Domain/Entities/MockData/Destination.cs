namespace Cms.Domain.Entities.MockData;

/// <summary>
/// Travel destination for card grid widget.
/// </summary>
public sealed class Destination
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Price { get; set; } = string.Empty;
    public decimal Rating { get; set; }
    public string Image { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
}

