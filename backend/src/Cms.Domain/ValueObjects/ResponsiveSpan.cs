namespace Cms.Domain.ValueObjects;

/// <summary>
/// Responsive column span configuration for different breakpoints.
/// </summary>
public sealed record ResponsiveSpan
{
    public int Mobile { get; init; } = 12;
    public int Tablet { get; init; } = 6;
    public int Desktop { get; init; } = 4;
}

