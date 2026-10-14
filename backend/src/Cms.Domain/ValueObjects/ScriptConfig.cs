namespace Cms.Domain.ValueObjects;

/// <summary>
/// Configuration for head/body script injection.
/// </summary>
public sealed record ScriptConfig
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Name { get; init; } = string.Empty;
    public string? Src { get; init; }
    public string? Content { get; init; }
    public bool Async { get; init; }
    public bool Defer { get; init; }
    public string Position { get; init; } = "head";
    public bool Enabled { get; init; } = true;
}

