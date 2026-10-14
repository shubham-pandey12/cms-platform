using System.Text.Json;
using Cms.Domain.Enums;
using Cms.Domain.Interfaces;
using Cms.Domain.ValueObjects;

namespace Cms.Widgets.Cta.V1;

/// <summary>
/// Call to Action widget version 1.0.0.
/// </summary>
public sealed class CtaWidgetV1Definition : IWidgetVersionProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public string Slug => "widget-cta";
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
                    new { name = "heading", label = "Heading", type = "localizedText", required = true, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "description", label = "Description", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "buttonText", label = "Button Text", type = "localizedText", required = true, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "buttonUrl", label = "Button URL", type = "text", required = true },
                    new { name = "style", label = "Style", type = "select", required = false }
                },
                styleableElements = new object[]
                {
                    new { name = "heading", label = "Heading" },
                    new { name = "description", label = "Description" },
                    new { name = "button", label = "Button" }
                }
            }, JsonOptions);

        var defaultConfig = JsonSerializer.Serialize(
            new
            {
                heading = new Dictionary<string, string> { ["en-GB"] = "Ready to Start?", ["fr-FR"] = "Prêt à commencer ?" },
                description = new Dictionary<string, string> { ["en-GB"] = "Book your dream vacation today", ["fr-FR"] = "Réservez vos vacances de rêve aujourd'hui" },
                buttonText = new Dictionary<string, string> { ["en-GB"] = "Get Started", ["fr-FR"] = "Commencer" },
                buttonUrl = "#",
                style = "primary"
            },
            JsonOptions);

        return new WidgetVersionInfo(
            Id: Guid.Parse("50000000-0000-0000-0001-00000000001b"),
            Name: "Call to Action",
            Description: "Call to action section with button",
            Category: WidgetCategory.Interactive,
            Icon: "mouse-pointer-click",
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
