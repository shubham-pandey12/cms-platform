using System.Text.Json;
using Cms.Domain.Enums;
using Cms.Domain.Interfaces;
using Cms.Domain.ValueObjects;

namespace Cms.Widgets.Example.V1;

/// <summary>
/// Example widget version 1.0.0 - Demonstrates the widget folder convention.
/// </summary>
public sealed class ExampleWidgetV1Definition : IWidgetVersionProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public string Slug => "widget-example";
    public string Version => "1.0.0";

    public WidgetVersionInfo GetVersionInfo()
    {
        var configSchema = JsonSerializer.Serialize(
            new
            {
                fields = new object[]
                {
                    new { name = "message", label = "Message", type = "localizedText", required = false, langs = new[] { "en-GB", "fr-FR" } }
                }
            }, JsonOptions);

        var defaultConfig = JsonSerializer.Serialize(
            new { message = new Dictionary<string, string> { ["en-GB"] = "Example widget", ["fr-FR"] = "Widget exemple" } },
            JsonOptions);

        return new WidgetVersionInfo(
            Id: Guid.Parse("50000000-0000-0000-0001-0000000000ff"),
            Name: "Example",
            Description: "Example widget demonstrating the widget folder convention",
            Category: WidgetCategory.Content,
            Icon: "square",
            Thumbnail: null,
            ConfigSchema: configSchema,
            DefaultConfig: defaultConfig,
            DefaultStyles: null,
            ChangeLog: null
        );
    }
}
