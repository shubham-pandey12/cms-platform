using System.Text.Json;
using Cms.Domain.Enums;
using Cms.Domain.Interfaces;
using Cms.Domain.ValueObjects;

namespace Cms.Widgets.Faq.V1;

/// <summary>
/// FAQ Accordion widget version 1.0.0.
/// </summary>
public sealed class FaqWidgetV1Definition : IWidgetVersionProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public string Slug => "widget-faq";
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
                    new { name = "allowMultiple", label = "Allow Multiple Open", type = "toggle", required = false },
                    new { name = "apiEndpoint", label = "API Endpoint (Optional)", type = "text", required = false, defaultValue = "", placeholder = "https://api.example.com/faqs", helpText = "Optional API to fetch FAQ items. Leave empty to use manual FAQs below. When provided, manual FAQs are ignored." },
                    new { name = "questions", label = "FAQ Items", type = "array", required = false, helpText = "Configure FAQs manually when not using API", arrayItemSchema = new object[] { new { name = "question", label = "Question", type = "localizedText", required = true, langs = new[] { "en-GB", "fr-FR" } }, new { name = "answer", label = "Answer", type = "localizedText", required = true, langs = new[] { "en-GB", "fr-FR" } } } }
                }
            }, JsonOptions);

        var defaultConfig = JsonSerializer.Serialize(
            new
            {
                title = new Dictionary<string, string> { ["en-GB"] = "Frequently Asked Questions", ["fr-FR"] = "Questions fréquentes" },
                allowMultiple = false,
                questions = new object[]
                {
                    new { id = "faq-1", question = new Dictionary<string, string> { ["en-GB"] = "What services do you offer?", ["fr-FR"] = "Quels services proposez-vous ?" }, answer = new Dictionary<string, string> { ["en-GB"] = "We offer a wide range of services tailored to your needs.", ["fr-FR"] = "Nous proposons une large gamme de services adaptés à vos besoins." } },
                    new { id = "faq-2", question = new Dictionary<string, string> { ["en-GB"] = "How can I get started?", ["fr-FR"] = "Comment puis-je commencer ?" }, answer = new Dictionary<string, string> { ["en-GB"] = "Contact us through our form or give us a call.", ["fr-FR"] = "Contactez-nous via notre formulaire ou appelez-nous." } }
                }
            },
            JsonOptions);

        return new WidgetVersionInfo(
            Id: Guid.Parse("50000000-0000-0000-0001-00000000000c"),
            Name: "FAQ Accordion",
            Description: "Frequently asked questions with expandable answers",
            Category: WidgetCategory.Content,
            Icon: "help-circle",
            Thumbnail: null,
            ConfigSchema: configSchema,
            DefaultConfig: defaultConfig,
            DefaultStyles: defaultStyles,
            ChangeLog: null
        );
    }
}
