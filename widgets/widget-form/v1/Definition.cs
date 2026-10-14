using System.Text.Json;
using Cms.Domain.Enums;
using Cms.Domain.Interfaces;
using Cms.Domain.ValueObjects;

namespace Cms.Widgets.Form.V1;

/// <summary>
/// Contact Form widget version 1.0.0.
/// </summary>
public sealed class FormWidgetV1Definition : IWidgetVersionProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public string Slug => "widget-form";
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
                    new { name = "submitEndpoint", label = "Submit Endpoint", type = "text", required = true, defaultValue = "/api/contact", helpText = "API endpoint to submit the form data" },
                    new { name = "successMessage", label = "Success Message", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "successDescription", label = "Success Description", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "submittingText", label = "Submitting Button Text", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "fields", label = "Form Fields", type = "array", required = false, helpText = "Configure the form fields to display", arrayItemSchema = new object[] { new { name = "name", label = "Field Name", type = "text", required = true, helpText = "Internal field name (e.g., 'email', 'phone')" }, new { name = "label", label = "Field Label", type = "localizedText", required = true, langs = new[] { "en-GB", "fr-FR" }, helpText = "Label shown to users" }, new { name = "type", label = "Field Type", type = "select", required = true, defaultValue = "text", options = new object[] { new { label = "Text", value = "text" }, new { label = "Email", value = "email" }, new { label = "Phone", value = "tel" }, new { label = "Number", value = "number" }, new { label = "Textarea", value = "textarea" } } }, new { name = "placeholder", label = "Placeholder", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } }, new { name = "required", label = "Required", type = "toggle", required = false, defaultValue = false } } }
                }
            }, JsonOptions);

        var defaultConfig = JsonSerializer.Serialize(
            new
            {
                submitEndpoint = "/api/contact",
                successMessage = new Dictionary<string, string> { ["en-GB"] = "Thank you for your message!", ["fr-FR"] = "Merci pour votre message !" },
                successDescription = new Dictionary<string, string> { ["en-GB"] = "Your form has been submitted successfully.", ["fr-FR"] = "Votre formulaire a été envoyé avec succès." },
                submittingText = new Dictionary<string, string> { ["en-GB"] = "Submitting...", ["fr-FR"] = "Envoi en cours..." },
                fields = new object[]
                {
                    new { id = "field-1", name = "name", label = new Dictionary<string, string> { ["en-GB"] = "Your Name", ["fr-FR"] = "Votre nom" }, type = "text", placeholder = new Dictionary<string, string> { ["en-GB"] = "Enter your name", ["fr-FR"] = "Entrez votre nom" }, required = true },
                    new { id = "field-2", name = "email", label = new Dictionary<string, string> { ["en-GB"] = "Email Address", ["fr-FR"] = "Adresse e-mail" }, type = "email", placeholder = new Dictionary<string, string> { ["en-GB"] = "Enter your email", ["fr-FR"] = "Entrez votre e-mail" }, required = true },
                    new { id = "field-3", name = "message", label = new Dictionary<string, string> { ["en-GB"] = "Your Message", ["fr-FR"] = "Votre message" }, type = "textarea", placeholder = new Dictionary<string, string> { ["en-GB"] = "Enter your message", ["fr-FR"] = "Entrez votre message" }, required = true }
                }
            },
            JsonOptions);

        return new WidgetVersionInfo(
            Id: Guid.Parse("50000000-0000-0000-0001-00000000000a"),
            Name: "Contact Form",
            Description: "Contact form with validation and customizable fields",
            Category: WidgetCategory.Interactive,
            Icon: "mail",
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
