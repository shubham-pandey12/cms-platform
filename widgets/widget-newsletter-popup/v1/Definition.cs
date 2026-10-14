using System.Text.Json;
using Cms.Domain.Enums;
using Cms.Domain.Interfaces;
using Cms.Domain.ValueObjects;

namespace Cms.Widgets.NewsletterPopup.V1;

/// <summary>
/// Newsletter Popup widget version 1.0.0.
/// </summary>
public sealed class NewsletterPopupWidgetV1Definition : IWidgetVersionProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public string Slug => "widget-newsletter-popup";
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
                    new { name = "title", label = "Popup Title", type = "localizedText", required = true, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "description", label = "Description", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "placeholder", label = "Email Placeholder", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "buttonText", label = "Subscribe Button Text", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "closeText", label = "Close Button Text", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "triggerDelay", label = "Trigger Delay (seconds)", type = "number", required = true },
                    new { name = "showOnce", label = "Show Only Once Per Session", type = "toggle", required = false },
                    new { name = "enableCloseButton", label = "Show Close Button", type = "toggle", required = false },
                    new { name = "collectName", label = "Collect Name Field", type = "toggle", required = false },
                    new { name = "successMessage", label = "Success Message", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "submittingText", label = "Submitting Button Text", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "endpoint", label = "Submit Endpoint", type = "text", required = true }
                },
                styleableElements = new object[]
                {
                    new { name = "title", label = "Title" },
                    new { name = "description", label = "Description" },
                    new { name = "subscribeButton", label = "Subscribe Button" },
                    new { name = "closeButton", label = "Close Button" },
                    new { name = "input", label = "Input Field" }
                }
            }, JsonOptions);

        var defaultConfig = JsonSerializer.Serialize(
            new
            {
                title = new Dictionary<string, string> { ["en-GB"] = "Subscribe to Our Newsletter", ["fr-FR"] = "Abonnez-vous à notre newsletter" },
                description = new Dictionary<string, string> { ["en-GB"] = "Get the latest updates and exclusive offers", ["fr-FR"] = "Recevez les dernières actualités et offres exclusives" },
                placeholder = new Dictionary<string, string> { ["en-GB"] = "Enter your email", ["fr-FR"] = "Entrez votre e-mail" },
                buttonText = new Dictionary<string, string> { ["en-GB"] = "Subscribe", ["fr-FR"] = "S'abonner" },
                closeText = new Dictionary<string, string> { ["en-GB"] = "No thanks", ["fr-FR"] = "Non merci" },
                triggerDelay = 5,
                showOnce = true,
                enableCloseButton = true,
                collectName = false,
                successMessage = new Dictionary<string, string> { ["en-GB"] = "Thanks for subscribing!", ["fr-FR"] = "Merci de vous être abonné !" },
                submittingText = new Dictionary<string, string> { ["en-GB"] = "Subscribing...", ["fr-FR"] = "Inscription..." },
                endpoint = "/api/newsletter/subscribe"
            },
            JsonOptions);

        return new WidgetVersionInfo(
            Id: Guid.Parse("50000000-0000-0000-0001-00000000001a"),
            Name: "Newsletter Popup",
            Description: "Email signup popup with time delay trigger",
            Category: WidgetCategory.Interactive,
            Icon: "mail-plus",
            Thumbnail: null,
            ConfigSchema: configSchema,
            DefaultConfig: defaultConfig,
            DefaultStyles: defaultStyles,
            ChangeLog: null
        );
    }
}
