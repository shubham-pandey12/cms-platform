using System.Text.Json;
using Cms.Domain.Enums;
using Cms.Domain.Interfaces;
using Cms.Domain.ValueObjects;

namespace Cms.Widgets.Gallery.V1;

/// <summary>
/// Image Gallery widget version 1.0.0.
/// </summary>
public sealed class GalleryWidgetV1Definition : IWidgetVersionProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public string Slug => "widget-gallery";
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
                    new { name = "apiEndpoint", label = "API Endpoint (Optional)", type = "text", required = false, placeholder = "https://api.example.com/images", helpText = "Enter API endpoint URL to fetch images. Leave empty to use manually configured images below." },
                    new { name = "columns", label = "Grid Columns", type = "select", required = false, defaultValue = "4", options = new object[] { new { label = "2 Columns", value = "2" }, new { label = "3 Columns", value = "3" }, new { label = "4 Columns", value = "4" } } },
                    new { name = "imageSizes", label = "Image Sizes (Advanced)", type = "text", required = false, defaultValue = "", placeholder = "(max-width: 640px) 100vw, 50vw", helpText = "Override the responsive image sizes attribute. Leave empty to auto-calculate from grid columns. Uses the HTML sizes format, e.g. '(max-width: 768px) 100vw, 33vw'." },
                    new { name = "images", label = "Gallery Images", type = "array", required = false, helpText = "Manually configure images when not using an API endpoint", arrayItemSchema = new object[] { new { name = "src", label = "Image URL", type = "media", required = true }, new { name = "alt", label = "Alt Text", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" }, placeholder = "Describe the image" }, new { name = "caption", label = "Caption", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" }, placeholder = "Optional caption" } } }
                }
            }, JsonOptions);

        var defaultConfig = JsonSerializer.Serialize(
            new
            {
                columns = "4",
                apiEndpoint = "",
                imageSizes = "",
                images = new object[]
                {
                    new { src = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop", alt = new Dictionary<string, string> { ["en-GB"] = "Mountain view", ["fr-FR"] = "Vue montagne" }, caption = new Dictionary<string, string> { ["en-GB"] = "", ["fr-FR"] = "" } },
                    new { src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop", alt = new Dictionary<string, string> { ["en-GB"] = "Peak landscape", ["fr-FR"] = "Paysage de montagne" }, caption = new Dictionary<string, string> { ["en-GB"] = "", ["fr-FR"] = "" } },
                    new { src = "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop", alt = new Dictionary<string, string> { ["en-GB"] = "City skyline", ["fr-FR"] = "Horizon urbain" }, caption = new Dictionary<string, string> { ["en-GB"] = "", ["fr-FR"] = "" } },
                    new { src = "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop", alt = new Dictionary<string, string> { ["en-GB"] = "Resort pool", ["fr-FR"] = "Piscine du complexe" }, caption = new Dictionary<string, string> { ["en-GB"] = "", ["fr-FR"] = "" } },
                    new { src = "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&h=300&fit=crop", alt = new Dictionary<string, string> { ["en-GB"] = "Beach sunset", ["fr-FR"] = "Coucher de soleil sur la plage" }, caption = new Dictionary<string, string> { ["en-GB"] = "", ["fr-FR"] = "" } },
                    new { src = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop", alt = new Dictionary<string, string> { ["en-GB"] = "Nature path", ["fr-FR"] = "Sentier nature" }, caption = new Dictionary<string, string> { ["en-GB"] = "", ["fr-FR"] = "" } }
                }
            },
            JsonOptions);

        return new WidgetVersionInfo(
            Id: Guid.Parse("50000000-0000-0000-0001-000000000009"),
            Name: "Image Gallery",
            Description: "Responsive image gallery with lightbox",
            Category: WidgetCategory.Media,
            Icon: "images",
            Thumbnail: null,
            ConfigSchema: configSchema,
            DefaultConfig: defaultConfig,
            DefaultStyles: defaultStyles,
            ChangeLog: null
        );
    }
}
