namespace Cms.Domain.Entities.MockData;

/// <summary>
/// FAQ item for accordion widget.
/// </summary>
public sealed class FaqItem
{
    public Guid Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
}

