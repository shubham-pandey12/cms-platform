namespace Cms.Domain.Entities.MockData;

/// <summary>
/// Simple destination for list widget.
/// </summary>
public sealed class SimpleDestination
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool Featured { get; set; }
}

