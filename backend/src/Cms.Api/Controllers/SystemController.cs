using Microsoft.AspNetCore.Mvc;

namespace Cms.Api.Controllers;

/// <summary>
/// Provides system configuration endpoints.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class SystemController : ControllerBase
{
    /// <summary>
    /// Gets system-wide style configuration including spacing, shadows, and widget categories.
    /// </summary>
    [HttpGet("config")]
    public ActionResult<SystemConfigResponse> GetConfig()
    {
        var config = new SystemConfigResponse
        {
            Spacing = new SpacingConfig
            {
                Padding = new Dictionary<string, string>
                {
                    ["none"] = "0",
                    ["sm"] = "16px",
                    ["md"] = "32px",
                    ["lg"] = "48px",
                    ["xl"] = "64px"
                },
                Margin = new Dictionary<string, string>
                {
                    ["none"] = "0",
                    ["sm"] = "8px",
                    ["md"] = "16px",
                    ["lg"] = "24px",
                    ["xl"] = "32px"
                },
                BorderRadius = new Dictionary<string, string>
                {
                    ["none"] = "0",
                    ["sm"] = "4px",
                    ["md"] = "8px",
                    ["lg"] = "16px",
                    ["xl"] = "24px"
                },
                Gap = new Dictionary<string, string>
                {
                    ["none"] = "0",
                    ["sm"] = "8px",
                    ["md"] = "16px",
                    ["lg"] = "24px",
                    ["xl"] = "32px"
                }
            },
            Shadows = new Dictionary<string, string>
            {
                ["none"] = "none",
                ["sm"] = "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                ["md"] = "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                ["lg"] = "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                ["xl"] = "0 25px 50px -12px rgb(0 0 0 / 0.25)"
            },
            WidgetCategories =
            [
                new WidgetCategoryDto("layout", "Layout", "layout-grid", "Structure and layout components", 1),
                new WidgetCategoryDto("content", "Content", "type", "Text and content blocks", 2),
                new WidgetCategoryDto("media", "Media", "image", "Images, videos, and galleries", 3),
                new WidgetCategoryDto("interactive", "Interactive", "mouse-pointer-click", "Forms, buttons, and actions", 4),
                new WidgetCategoryDto("navigation", "Navigation", "menu", "Menus and navigation elements", 5)
            ]
        };

        return Ok(config);
    }
}

/// <summary>
/// System configuration response.
/// </summary>
public sealed record SystemConfigResponse
{
    public required SpacingConfig Spacing { get; init; }
    public required Dictionary<string, string> Shadows { get; init; }
    public required List<WidgetCategoryDto> WidgetCategories { get; init; }
}

/// <summary>
/// Spacing configuration.
/// </summary>
public sealed record SpacingConfig
{
    public required Dictionary<string, string> Padding { get; init; }
    public required Dictionary<string, string> Margin { get; init; }
    public required Dictionary<string, string> BorderRadius { get; init; }
    public required Dictionary<string, string> Gap { get; init; }
}

/// <summary>
/// Widget category definition.
/// </summary>
public sealed record WidgetCategoryDto(
    string Id,
    string Name,
    string Icon,
    string Description,
    int Order
);

