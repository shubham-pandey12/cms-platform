using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cms.Widgets;

/// <summary>
/// Example widget-specific API. Demonstrates optional per-widget Controller discovery.
/// </summary>
[ApiController]
[Route("api/widgets/example")]
[Authorize]
public sealed class ExampleWidgetController : ControllerBase
{
    /// <summary>
    /// Example endpoint for the example widget (e.g. health or config check).
    /// </summary>
    [HttpGet("ping")]
    public IActionResult Ping() => Ok(new { message = "Example widget API", ok = true });
}
