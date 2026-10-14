namespace Cms.Domain.ValueObjects;

/// <summary>
/// Style configuration for a page section.
/// </summary>
public sealed record SectionStyles
{
    public string? BackgroundColor { get; init; }
    public string? Padding { get; init; }
    public string? Margin { get; init; }
    public bool FullWidth { get; init; }
    public string? ContainerMaxWidth { get; init; }
}

