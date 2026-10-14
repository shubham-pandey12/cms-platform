using Cms.Domain.Enums;
using Cms.Domain.ValueObjects;

namespace Cms.Domain.Entities;

/// <summary>
/// Represents a CMS page with content sections and SEO configuration.
/// </summary>
public sealed class Page
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Uri { get; set; } = "/";
    public bool IsDynamic { get; set; }

    /// <summary>
    /// Names of URL variables extracted from <see cref="Uri"/>, stored WITHOUT angle brackets.
    /// For example, a URI of <c>/packages/&lt;PACKAGE_SLUG&gt;</c> yields <c>["PACKAGE_SLUG"]</c>.
    /// The UI displays them as <c>&lt;PACKAGE_SLUG&gt;</c>, but only the bare name is persisted here.
    /// Variable names follow SCREAMING_SNAKE_CASE convention ([A-Z_]+).
    /// </summary>
    public List<string> DynamicVariables { get; set; } = [];
    public PageStatus Status { get; set; } = PageStatus.Draft;
    public PageSeo Seo { get; set; } = new();
    public Guid LayoutId { get; set; }

    /// <summary>
    /// The main page content stored as JSON (PageSection[]).
    /// </summary>
    public string BodyContent { get; set; } = "[]";

    public Guid? ThemeId { get; set; }
    public string? LayoutConfigJson { get; set; }
    public string? CustomCss { get; set; }
    /// <summary>
    /// Semantic version (major.minor.patch) for the page; e.g. "1.0.0".
    /// </summary>
    public string Version { get; set; } = "1.0.0";
    public Guid? PublishedRevisionId { get; set; }
    public Guid DraftRevisionId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public Guid UpdatedBy { get; set; }

    // Navigation properties
    public Brand Brand { get; set; } = null!;
    public Theme? Theme { get; set; }
    public SiteLayout? Layout { get; set; }
    public ICollection<PageRevision> Revisions { get; set; } = [];
    public PageDataConfig? PageData { get; set; }
}

