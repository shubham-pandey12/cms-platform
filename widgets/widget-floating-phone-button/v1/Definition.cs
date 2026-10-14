using System.Text.Json;
using Cms.Domain.Enums;
using Cms.Domain.Interfaces;
using Cms.Domain.ValueObjects;

namespace Cms.Widgets.FloatingPhoneButton.V1;

/// <summary>
/// Floating Phone Button widget version 1.0.0.
/// </summary>
public sealed class FloatingPhoneButtonWidgetV1Definition : IWidgetVersionProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public string Slug => "widget-floating-phone-button";
    public string Version => "1.0.0";

    public WidgetVersionInfo GetVersionInfo()
    {
        var defaultStyles = new WidgetStyles
        {
            BackgroundColor = "transparent",
            Padding = "none",
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
                    new { name = "phoneNumber", label = "Phone Number (Display)", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" }, placeholder = "0207 071 3636" },
                    new { name = "phoneLink", label = "Phone Number (Link)", type = "text", required = false, defaultValue = "02070713636", placeholder = "02070713636", helpText = "Phone number without spaces for tel: link" },
                    new { name = "showText", label = "Show Text Label", type = "toggle", required = false, defaultValue = true },
                    new
                    {
                        name = "textBehavior",
                        label = "Text Visibility",
                        type = "select",
                        required = false,
                        defaultValue = "hover",
                        options = new object[]
                        {
                            new { label = "Show on Hover", value = "hover" },
                            new { label = "Always Show", value = "always" }
                        },
                        helpText = "When to display the phone number text"
                    },
                    new
                    {
                        name = "position",
                        label = "Position",
                        type = "select",
                        required = false,
                        defaultValue = "bottom-left",
                        options = new object[]
                        {
                            new { label = "Bottom Left", value = "bottom-left" },
                            new { label = "Bottom Right", value = "bottom-right" },
                            new { label = "Top Left", value = "top-left" },
                            new { label = "Top Right", value = "top-right" }
                        }
                    },
                    new
                    {
                        name = "horizontalOffset",
                        label = "Horizontal Offset",
                        type = "select",
                        required = false,
                        defaultValue = "md",
                        options = new object[]
                        {
                            new { label = "Small (2rem)", value = "sm" },
                            new { label = "Medium (2rem)", value = "md" },
                            new { label = "Large (3rem)", value = "lg" }
                        }
                    },
                    new
                    {
                        name = "verticalOffset",
                        label = "Vertical Offset",
                        type = "select",
                        required = false,
                        defaultValue = "md",
                        options = new object[]
                        {
                            new { label = "Small (2rem)", value = "sm" },
                            new { label = "Medium (2rem)", value = "md" },
                            new { label = "Large (3rem)", value = "lg" }
                        }
                    },
                    new { name = "backgroundColor", label = "Background Color", type = "color", required = false, defaultValue = "#cf132a" },
                    new { name = "hoverBackgroundColor", label = "Hover Background Color", type = "color", required = false, defaultValue = "#b01125" },
                    new { name = "textColor", label = "Text Color", type = "color", required = false, defaultValue = "#ffffff" },
                    new
                    {
                        name = "size",
                        label = "Button Size",
                        type = "select",
                        required = false,
                        defaultValue = "md",
                        options = new object[]
                        {
                            new { label = "Small", value = "sm" },
                            new { label = "Medium", value = "md" },
                            new { label = "Large", value = "lg" }
                        }
                    },
                    new { name = "enableScaleAnimation", label = "Enable Scale Animation on Hover", type = "toggle", required = false, defaultValue = true },
                    new { name = "zIndex", label = "Z-Index", type = "number", required = false, defaultValue = 50, helpText = "Stacking order (higher values appear on top)" }
                }
            }, JsonOptions);

        var defaultConfig = JsonSerializer.Serialize(
            new
            {
                phoneNumber = new Dictionary<string, string> { ["en-GB"] = "0207 071 3636", ["fr-FR"] = "0207 071 3636" },
                phoneLink = "02070713636",
                showText = true,
                textBehavior = "hover",
                position = "bottom-left",
                horizontalOffset = "md",
                verticalOffset = "md",
                backgroundColor = "#cf132a",
                hoverBackgroundColor = "#b01125",
                textColor = "#ffffff",
                size = "md",
                enableScaleAnimation = true,
                zIndex = 50
            }, JsonOptions);

        return new WidgetVersionInfo(
            Id: Guid.Parse("50000000-0000-0000-0001-000000000021"),
            Name: "Floating Phone Button",
            Description: "Floating phone button with customizable position, colors, and text visibility for call-to-action",
            Category: WidgetCategory.Interactive,
            Icon: "phone",
            Thumbnail: null,
            ConfigSchema: configSchema,
            DefaultConfig: defaultConfig,
            DefaultStyles: defaultStyles,
            ChangeLog: null
        );
    }
}
