namespace Cms.Domain.Entities.MockData;

/// <summary>
/// Travel package for featured packages widget.
/// </summary>
public sealed class TravelPackage
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Price { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public decimal Rating { get; set; }
    public string Location { get; set; } = string.Empty;
}

