namespace Cms.Domain.Entities;

/// <summary>
/// Represents a reusable page template.
/// </summary>
public sealed class Template
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid? BrandId { get; set; }

    /// <summary>
    /// Template content stored as JSON (PageSection[]).
    /// </summary>
    public string BodyContent { get; set; } = "[]";

    public string? Thumbnail { get; set; }
    public string? Category { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedBy { get; set; }

    // Navigation properties
    public Brand? Brand { get; set; }
}

