using System.Text.Json;
using Cms.Domain.Enums;
using Cms.Domain.Interfaces;
using Cms.Domain.ValueObjects;

namespace Cms.Widgets.HolidayCollections.V1;

/// <summary>
/// Holiday Collections widget version 1.0.0.
/// </summary>
public sealed class HolidayCollectionsWidgetV1Definition : IWidgetVersionProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public string Slug => "widget-holiday-collections";
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
                    new { name = "title", label = "Section Title", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "subtitle", label = "Subtitle", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "columns", label = "Grid Columns", type = "select", required = false, defaultValue = 3, options = new object[]
                    {
                        new { label = "1 Column", value = 1 },
                        new { label = "2 Columns", value = 2 },
                        new { label = "3 Columns", value = 3 }
                    }},
                    new { name = "showEnquiryModal", label = "Show Enquiry Modal", type = "toggle", required = false, defaultValue = true },
                    new { name = "enquirySuccessMessage", label = "Enquiry Success Message", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" }, helpText = "Message shown when enquiry form is submitted (package name is appended when present)." },
                    new { name = "imageSizes", label = "Image Sizes (Advanced)", type = "text", required = false, defaultValue = "", placeholder = "(max-width: 768px) 100vw, 33vw", helpText = "Override the responsive image sizes attribute." },
                    new { name = "apiEndpoint", label = "API Endpoint (Optional)", type = "text", required = false, placeholder = "https://api.example.com/packages", helpText = "Enter API endpoint URL to fetch holiday packages." },
                    new
                    {
                        name = "packages",
                        label = "Holiday Packages",
                        type = "array",
                        required = false,
                        helpText = "Manual packages when not using API. API data takes precedence when endpoint is set.",
                        arrayItemSchema = new object[]
                        {
                            new { name = "locationName", label = "Location / Title", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } },
                            new { name = "imageUrl", label = "Image URL", type = "media", required = false },
                            new { name = "category", label = "Category", type = "text", required = false },
                            new { name = "description", label = "Description", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } },
                            new { name = "url", label = "URL", type = "text", required = false }
                        }
                    }
                },
                styleableElements = new object[]
                {
                    new { name = "title", label = "Title" },
                    new { name = "categoryBadge", label = "Category Badge" },
                    new { name = "price", label = "Price" },
                    new { name = "primaryButton", label = "View Deal Button" },
                    new { name = "secondaryButton", label = "Call Button" },
                    new { name = "card", label = "Card Container" },
                    new { name = "saveBadge", label = "Save Badge" }
                }
            }, JsonOptions);

        var defaultConfig = JsonSerializer.Serialize(
            new
            {
                title = new Dictionary<string, string> { ["en-GB"] = "Exclusive Cuba Collections", ["fr-FR"] = "Collections Cuba exclusives" },
                subtitle = new Dictionary<string, string> { ["en-GB"] = "Handpicked multicentre holidays and luxury escapes", ["fr-FR"] = "Séjours multicentres et escapades de luxe sélectionnés" },
                columns = 3,
                showEnquiryModal = true,
                enquirySuccessMessage = new Dictionary<string, string> { ["en-GB"] = "Enquiry Sent! One of our specialists will be in touch shortly.", ["fr-FR"] = "Demande envoyée ! Un de nos spécialistes vous recontactera sous peu." },
                imageSizes = "",
                packages = new object[] { }
            },
            JsonOptions);

        return new WidgetVersionInfo(
            Id: Guid.Parse("50000000-0000-0000-0001-00000000001c"),
            Name: "Holiday Collections",
            Description: "Display holiday packages in a responsive card grid with pricing, amenities, and enquiry modal",
            Category: WidgetCategory.Interactive,
            Icon: "plane",
            Thumbnail: null,
            ConfigSchema: configSchema,
            DefaultConfig: defaultConfig,
            DefaultStyles: defaultStyles,
            ChangeLog: null
        );
    }
}
