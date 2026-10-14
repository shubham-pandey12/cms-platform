namespace Cms.Domain.ValueObjects;

/// <summary>
/// Font configuration for themes.
/// </summary>
public sealed record FontConfig
{
    public string Family { get; init; } = string.Empty;
    public List<int> Weights { get; init; } = [400];
    public List<string> Fallbacks { get; init; } = [];
    public string Source { get; init; } = "system";
    public string? Url { get; init; }
}

