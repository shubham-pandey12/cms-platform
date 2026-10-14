namespace Cms.Domain.Entities;

/// <summary>
/// Site-wide settings for a brand.
/// </summary>
public sealed class SiteSettings
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public string SiteDescription { get; set; } = string.Empty;
    public string Favicon { get; set; } = string.Empty;
    public string OgImage { get; set; } = string.Empty;
    public bool ShowNavigation { get; set; } = true;
    public string NavigationPosition { get; set; } = "top";
    public string NavigationStyle { get; set; } = "standard";
    public bool ShowLogo { get; set; } = true;
    public string LogoUrl { get; set; } = string.Empty;
    public bool EnableSearch { get; set; }
    public string GoogleAnalyticsId { get; set; } = string.Empty;
    public string CustomHeadCode { get; set; } = string.Empty;
    public bool EnableSocialSharing { get; set; } = true;
    public string TwitterHandle { get; set; } = string.Empty;
    public string CustomDomain { get; set; } = string.Empty;
    public string RobotsTxt { get; set; } = "User-agent: *\nAllow: /";
    public string CanonicalUrl { get; set; } = string.Empty;
    public string? GlobalCss { get; set; }

    /// <summary>
    /// Head scripts stored as JSON (ScriptConfig[]).
    /// </summary>
    public string? HeadScripts { get; set; }

    /// <summary>
    /// Body scripts stored as JSON (ScriptConfig[]).
    /// </summary>
    public string? BodyScripts { get; set; }

    /// <summary>
    /// Supported language codes for widget i18n (e.g. ["en-GB", "fr-FR"]). Stored as JSON array.
    /// </summary>
    public string? SupportedLangsJson { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Brand Brand { get; set; } = null!;
}

