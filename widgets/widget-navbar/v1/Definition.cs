using System.Text.Json;
using Cms.Domain.Enums;
using Cms.Domain.Interfaces;

namespace Cms.Widgets.Navbar.V1;

/// <summary>
/// Navigation Bar widget version 1.0.0.
/// </summary>
public sealed class NavbarWidgetV1Definition : IWidgetVersionProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public string Slug => "widget-navbar";
    public string Version => "1.0.0";

    public WidgetVersionInfo GetVersionInfo()
    {
        var configSchema = JsonSerializer.Serialize(
            new
            {
                fields = new object[]
                {
                    new { name = "logoUrl", label = "Logo Image URL", type = "media", required = false },
                    new { name = "logoText", label = "Logo Text", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } },
                    new { name = "sticky", label = "Sticky Navigation", type = "toggle", required = false },
                    new
                    {
                        name = "menuItems",
                        label = "Menu Items",
                        type = "array",
                        required = false,
                        arrayItemSchema = new object[]
                        {
                            new { name = "label", label = "Label", type = "localizedText", required = true, langs = new[] { "en-GB", "fr-FR" } },
                            new { name = "url", label = "URL", type = "text", required = true },
                            new { name = "target", label = "Target", type = "select", required = false, options = new object[] { new { label = "Same window", value = "_self" }, new { label = "New tab", value = "_blank" } } }
                        }
                    }
                },
                styleableElements = new object[]
                {
                    new { name = "logo", label = "Logo" },
                    new { name = "logoText", label = "Logo Text" },
                    new { name = "menuItem", label = "Menu Item" },
                    new { name = "ctaButton", label = "CTA Button" }
                }
            }, JsonOptions);

        var defaultConfig = JsonSerializer.Serialize(
            new
            {
                logoText = new Dictionary<string, string> { ["en-GB"] = "Site Name", ["fr-FR"] = "Nom du site" },
                sticky = true,
                transparent = false,
                showSearch = true,
                menuItems = new object[]
                {
                    new { id = "menu-1", label = new Dictionary<string, string> { ["en-GB"] = "Home", ["fr-FR"] = "Accueil" }, url = "/", target = "_self" },
                    new { id = "menu-2", label = new Dictionary<string, string> { ["en-GB"] = "About", ["fr-FR"] = "À propos" }, url = "/about", target = "_self" },
                    new { id = "menu-3", label = new Dictionary<string, string> { ["en-GB"] = "Services", ["fr-FR"] = "Services" }, url = "/services", target = "_self" },
                    new { id = "menu-4", label = new Dictionary<string, string> { ["en-GB"] = "Contact", ["fr-FR"] = "Contact" }, url = "/contact", target = "_self" }
                }
            },
            JsonOptions);

        return new WidgetVersionInfo(
            Id: Guid.Parse("50000000-0000-0000-0001-000000000002"),
            Name: "Navigation Bar",
            Description: "Main navigation bar with logo and configurable menu items",
            Category: WidgetCategory.Navigation,
            Icon: "menu",
            Thumbnail: null,
            ConfigSchema: configSchema,
            DefaultConfig: defaultConfig,
            DefaultStyles: null,
            ChangeLog: null
        );
    }
}
