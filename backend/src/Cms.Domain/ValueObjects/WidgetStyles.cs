namespace Cms.Domain.ValueObjects;

/// <summary>
/// Style configuration for a widget instance.
/// </summary>
public sealed record WidgetStyles
{
    public string? BackgroundColor { get; init; }
    public string? TextColor { get; init; }
    public string Padding { get; init; } = "md";
    public string Margin { get; init; } = "none";
    public int BorderRadius { get; init; }
    public int BorderWidth { get; init; }
    public string? BorderColor { get; init; }
    public string Shadow { get; init; } = "none";
    public int Opacity { get; init; } = 100;
    public string? TextAlign { get; init; }
    public string? CustomClasses { get; init; }
}

