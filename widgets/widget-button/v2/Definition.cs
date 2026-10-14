using System.Text.Json;
using Cms.Domain.Enums;
using Cms.Domain.Interfaces;
using Cms.Domain.ValueObjects;

namespace Cms.Widgets.Button.V2;

/// <summary>
/// Button widget version 2.0.0 - Enhanced button with icon support, loading state, and size options.
/// </summary>
public sealed class ButtonWidgetV2Definition : IWidgetVersionProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public string Slug => "widget-button";
    public string Version => "2.0.0";

    public WidgetVersionInfo GetVersionInfo()
    {
        var defaultStyles = new WidgetStyles
        {
            BackgroundColor = "transparent",
            Padding = "md",
            Margin = "none",
            BorderRadius = 8,
            BorderWidth = 0,
            BorderColor = "transparent",
            Shadow = "sm",
            Opacity = 100
        };

        var configSchema = JsonSerializer.Serialize(
            new
            {
                fields = new object[]
                {
                    new { name = "text", label = "Button Text", type = "localizedText", required = true, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "url", label = "URL", type = "text", required = false },
                    new
                    {
                        name = "variant", label = "Variant", type = "select",
                        options = new object[]
                        {
                            new { label = "Primary", value = "primary" },
                            new { label = "Secondary", value = "secondary" },
                            new { label = "Outline", value = "outline" },
                            new { label = "Ghost", value = "ghost" },
                            new { label = "Destructive", value = "destructive" }
                        }
                    },
                    new
                    {
                        name = "size", label = "Size", type = "select",
                        options = new object[]
                        {
                            new { label = "Small", value = "sm" },
                            new { label = "Medium", value = "md" },
                            new { label = "Large", value = "lg" }
                        }
                    },
                    new { name = "icon", label = "Icon (Lucide name)", type = "text", required = false },
                    new
                    {
                        name = "iconPosition", label = "Icon Position", type = "select",
                        options = new object[]
                        {
                            new { label = "Left", value = "left" },
                            new { label = "Right", value = "right" }
                        }
                    },
                    new { name = "isLoading", label = "Show Loading State", type = "toggle", required = false },
                    new { name = "openInNewTab", label = "Open in New Tab", type = "toggle", required = false },
                    new { name = "fullWidth", label = "Full Width", type = "toggle", required = false }
                },
                styleableElements = new object[]
                {
                    new { name = "button", label = "Button" },
                    new { name = "icon", label = "Icon" }
                }
            }, JsonOptions);

        var defaultConfig = JsonSerializer.Serialize(
            new
            {
                text = new Dictionary<string, string> { ["en-GB"] = "Click Me", ["fr-FR"] = "Cliquez ici" },
                url = "#",
                variant = "primary",
                size = "md",
                icon = "",
                iconPosition = "left",
                isLoading = false,
                openInNewTab = false,
                fullWidth = false
            },
            JsonOptions);

        return new WidgetVersionInfo(
            Id: Guid.Parse("50000000-0000-0000-0002-000000000001"),
            Name: "Button",
            Description: "Enhanced call-to-action button with icon support and loading states",
            Category: WidgetCategory.Interactive,
            Icon: "square",
            Thumbnail: null,
            ConfigSchema: configSchema,
            DefaultConfig: defaultConfig,
            DefaultStyles: defaultStyles,
            ChangeLog: "Added icon support, loading state, size options (sm/md/lg), ghost and destructive variants, and full-width option"
        );
    }
}
