namespace Cms.Domain.Entities;

/// <summary>
/// Represents a site layout with header and footer configuration.
/// </summary>
public sealed class SiteLayout
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// When true, this layout is the brand's default header/footer. Exactly one per brand should be true.
    /// </summary>
    public bool IsDefault { get; set; }

    /// <summary>
    /// Header widgets stored as JSON (WidgetInstance[]).
    /// </summary>
    public string Header { get; set; } = "[]";

    /// <summary>
    /// Footer widgets stored as JSON (WidgetInstance[]).
    /// </summary>
    public string Footer { get; set; } = "[]";

    /// <summary>
    /// Sidebar widgets stored as JSON (WidgetInstance[]).
    /// </summary>
    public string? Sidebar { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedBy { get; set; }
    public Guid UpdatedBy { get; set; }

    // Navigation properties
    public Brand Brand { get; set; } = null!;
    public ICollection<Page> Pages { get; set; } = [];
}

