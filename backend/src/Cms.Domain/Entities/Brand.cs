namespace Cms.Domain.Entities;

/// <summary>
/// Represents a brand/tenant in the CMS with its branding configuration.
/// </summary>
public sealed class Brand
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Domain { get; set; } = string.Empty;
    public string? Subdomain { get; set; }
    public string? Logo { get; set; }
    public string PrimaryColor { get; set; } = "#0891b2";
    public string SecondaryColor { get; set; } = "#164e63";
    public string? GlobalCss { get; set; }
    public List<string> CustomFontUrls { get; set; } = [];
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Page> Pages { get; set; } = [];
    public ICollection<Template> Templates { get; set; } = [];
    public ICollection<MediaItem> MediaItems { get; set; } = [];
    public ICollection<Redirect> Redirects { get; set; } = [];
    public ICollection<SiteLayout> SiteLayouts { get; set; } = [];
    public SiteSettings? SiteSettings { get; set; }
    public ICollection<BrandDomain> BrandDomains { get; set; } = [];
}

