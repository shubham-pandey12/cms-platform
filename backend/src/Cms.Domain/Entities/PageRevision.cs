using Cms.Domain.ValueObjects;

namespace Cms.Domain.Entities;

/// <summary>
/// Represents a version snapshot of a page.
/// </summary>
public sealed class PageRevision
{
    public Guid Id { get; set; }
    public Guid PageId { get; set; }

    /// <summary>
    /// The page content stored as JSON (PageSection[]).
    /// </summary>
    public string LayoutData { get; set; } = "[]";

    public PageSeo Seo { get; set; } = new();
    public Guid? ThemeId { get; set; }
    public string? LayoutConfigJson { get; set; }
    public string? CustomCss { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedBy { get; set; }

    // Navigation properties
    public Page Page { get; set; } = null!;
}

