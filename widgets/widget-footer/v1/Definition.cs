using System.Text.Json;
using Cms.Domain.Enums;
using Cms.Domain.Interfaces;

namespace Cms.Widgets.Footer.V1;

/// <summary>
/// Footer widget version 1.0.0.
/// </summary>
public sealed class FooterWidgetV1Definition : IWidgetVersionProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public string Slug => "widget-footer";
    public string Version => "1.0.0";

    public WidgetVersionInfo GetVersionInfo()
    {
        var configSchema = JsonSerializer.Serialize(
            new
            {
                fields = new object[]
                {
                    new { name = "brandName", label = "Brand Name", type = "localizedText", langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "copyrightText", label = "Copyright Text", type = "localizedText", langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "newsletterPlaceholder", label = "Newsletter Email Placeholder", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "newsletterButtonText", label = "Newsletter Subscribe Button Text", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } }
                }
            }, JsonOptions);

        var defaultConfig = JsonSerializer.Serialize(
            new
            {
                brandName = new Dictionary<string, string> { ["en-GB"] = "Brand", ["fr-FR"] = "Marque" },
                copyrightText = new Dictionary<string, string> { ["en-GB"] = "© 2024. All rights reserved.", ["fr-FR"] = "© 2024. Tous droits réservés." }
            },
            JsonOptions);

        return new WidgetVersionInfo(
            Id: Guid.Parse("50000000-0000-0000-0001-000000000007"),
            Name: "Footer",
            Description: "Site footer with links and copyright",
            Category: WidgetCategory.Navigation,
            Icon: "panel-bottom",
            Thumbnail: null,
            ConfigSchema: configSchema,
            DefaultConfig: defaultConfig,
            DefaultStyles: null,
            ChangeLog: null
        );
    }
}
