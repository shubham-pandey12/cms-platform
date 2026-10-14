using Cms.Domain.ValueObjects;

namespace Cms.Domain.Entities;

/// <summary>
/// Represents a specific version of a widget definition with its schema and configuration.
/// </summary>
public sealed class WidgetDefinitionVersion
{
    public Guid Id { get; set; }

    /// <summary>
    /// References the parent widget by slug (e.g., "widget-button").
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// Semantic version string (e.g., "1.0.0", "2.1.0").
    /// </summary>
    public string Version { get; set; } = "1.0.0";

    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Widget configuration schema stored as JSON.
    /// </summary>
    public string ConfigSchema { get; set; } = "{}";

    /// <summary>
    /// Default configuration values stored as JSON.
    /// </summary>
    public string DefaultConfig { get; set; } = "{}";

    public WidgetStyles? DefaultStyles { get; set; }

    /// <summary>
    /// Release notes describing what changed in this version.
    /// </summary>
    public string? ChangeLog { get; set; }

    /// <summary>
    /// Indicates this is the latest version for the widget.
    /// </summary>
    public bool IsLatest { get; set; }

    /// <summary>
    /// Indicates this version is deprecated and should not be used for new widgets.
    /// </summary>
    public bool IsDeprecated { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Guid WidgetDefinitionId { get; set; }
    public WidgetDefinition WidgetDefinition { get; set; } = null!;
}
