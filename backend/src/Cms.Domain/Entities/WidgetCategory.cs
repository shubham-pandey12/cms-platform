namespace Cms.Domain.Entities;

/// <summary>
/// Widget category definition for organization.
/// </summary>
public sealed class WidgetCategoryDefinition
{
    public Guid Id { get; set; }
    public string CategoryId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Order { get; set; }
}

