using Cms.Domain.Enums;
using Cms.Domain.ValueObjects;

namespace Cms.Domain.Interfaces;

/// <summary>
/// Implemented by per-version Definition classes under the widgets tree, e.g.
/// <c>widgets/widget-my-widget/v1/</c> or <c>widgets/some-brand/widget-my-widget/v1/</c>.
/// Each version folder contains its own Definition.cs implementing this interface.
/// </summary>
public interface IWidgetVersionProvider
{
    /// <summary>
    /// The widget slug (e.g., "widget-button"). Must match the widget folder name (the <c>widget-*</c> segment), not the optional brand folder.
    /// </summary>
    string Slug { get; }

    /// <summary>
    /// The semantic version string (e.g., "1.0.0", "2.1.0").
    /// </summary>
    string Version { get; }

    /// <summary>
    /// Returns the version-specific widget information including schema and defaults.
    /// </summary>
    WidgetVersionInfo GetVersionInfo();
}

/// <summary>
/// Contains all version-specific information for a widget.
/// </summary>
/// <param name="Id">Stable GUID for this specific version. Must be unique across all widget versions.</param>
/// <param name="Name">Display name of the widget.</param>
/// <param name="Description">Description of what the widget does.</param>
/// <param name="Category">Widget category for grouping in the palette.</param>
/// <param name="Icon">Icon identifier (e.g., Lucide icon name).</param>
/// <param name="Thumbnail">Optional thumbnail URL for preview.</param>
/// <param name="ConfigSchema">JSON schema defining widget configuration fields.</param>
/// <param name="DefaultConfig">JSON containing default configuration values.</param>
/// <param name="DefaultStyles">Default style settings for the widget.</param>
/// <param name="ChangeLog">Description of what changed in this version (null for v1).</param>
/// <param name="IsAdvanced">Whether this is an advanced widget requiring more expertise.</param>
/// <param name="BrandIds">List of brand IDs this widget is available to (empty = all brands).</param>
/// <param name="SupportsHtmlEmbed">When true, the CMS may expose SSR HTML for this widget slug (requires a matching embed template in the frontend).</param>
public record WidgetVersionInfo(
    Guid Id,
    string Name,
    string Description,
    WidgetCategory Category,
    string Icon,
    string? Thumbnail,
    string ConfigSchema,
    string DefaultConfig,
    WidgetStyles? DefaultStyles,
    string? ChangeLog,
    bool IsAdvanced = false,
    List<Guid>? BrandIds = null,
    bool SupportsHtmlEmbed = false
);
