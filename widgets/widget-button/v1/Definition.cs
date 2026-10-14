using System.Text.Json;
using Cms.Domain.Enums;
using Cms.Domain.Interfaces;
using Cms.Domain.ValueObjects;

namespace Cms.Widgets.Button.V1;

/// <summary>
/// Button widget version 1.0.0 - Basic button with text, URL, and variant options.
/// </summary>
public sealed class ButtonWidgetV1Definition : IWidgetVersionProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public string Slug => "widget-button";
    public string Version => "1.0.0";

    public WidgetVersionInfo GetVersionInfo()
    {
        var defaultStyles = new WidgetStyles
        {
            BackgroundColor = "transparent",
            Padding = "md",
            Margin = "none",
            BorderRadius = 0,
            BorderWidth = 0,
            BorderColor = "transparent",
            Shadow = "none",
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
                            new { label = "Outline", value = "outline" }
                        }
                    }
                },
                styleableElements = new object[]
                {
                    new { name = "button", label = "Button" }
                }
            }, JsonOptions);

        var defaultConfig = JsonSerializer.Serialize(
            new
            {
                text = new Dictionary<string, string> { ["en-GB"] = "Click Me", ["fr-FR"] = "Cliquez ici" },
                url = "#",
                variant = "primary"
            },
            JsonOptions);

        return new WidgetVersionInfo(
            Id: Guid.Parse("50000000-0000-0000-0001-000000000001"),
            Name: "Button",
            Description: "Call-to-action button with customizable styles",
            Category: WidgetCategory.Interactive,
            Icon: "square",
            Thumbnail: null,
            ConfigSchema: configSchema,
            DefaultConfig: defaultConfig,
            DefaultStyles: defaultStyles,
            ChangeLog: null,
            IsAdvanced: false,
            BrandIds: null,
            SupportsHtmlEmbed: true
        );
    }
}
