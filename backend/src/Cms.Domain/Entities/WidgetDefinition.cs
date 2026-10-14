using Cms.Domain.Enums;
using Cms.Domain.ValueObjects;

namespace Cms.Domain.Entities;

/// <summary>
/// Defines a reusable widget type with its configuration schema.
/// Contains denormalized data from the latest version for convenience.
/// </summary>
public sealed class WidgetDefinition
{
    public Guid Id { get; set; }

    /// <summary>
    /// Human-readable identifier used for custom renderer lookup (e.g., "widget-navbar").
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public WidgetCategory Category { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;

    /// <summary>
    /// The latest version string (denormalized from LatestVersion).
    /// </summary>
    public string Version { get; set; } = "1.0.0";

    public string? Thumbnail { get; set; }

    /// <summary>
    /// Widget configuration schema stored as JSON (denormalized from LatestVersion).
    /// </summary>
    public string ConfigSchema { get; set; } = "{}";

    /// <summary>
    /// Default configuration values stored as JSON (denormalized from LatestVersion).
    /// </summary>
    public string DefaultConfig { get; set; } = "{}";

    /// <summary>
    /// Default styles (denormalized from LatestVersion).
    /// </summary>
    public WidgetStyles? DefaultStyles { get; set; }

    public List<Guid> BrandIds { get; set; } = [];
    public bool IsAdvanced { get; set; }

    /// <summary>
    /// When true, this widget may be requested as server-rendered HTML via the CMS frontend embed route.
    /// Declared on the widget version provider; stored denormalized on the definition row.
    /// </summary>
    public bool SupportsHtmlEmbed { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Reference to the latest version of this widget.
    /// </summary>
    public Guid? LatestVersionId { get; set; }

    // Navigation properties
    public List<WidgetDefinitionVersion> Versions { get; set; } = [];
}

