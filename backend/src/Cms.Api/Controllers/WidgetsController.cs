using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cms.Application.DTOs.Widgets.Responses;
using Cms.Application.Interfaces.Services;

namespace Cms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class WidgetsController : ControllerBase
{
    private readonly IWidgetService _widgetService;

    public WidgetsController(IWidgetService widgetService)
    {
        _widgetService = widgetService;
    }

    /// <summary>
    /// Gets all widget definitions, optionally filtered by brand. Allows anonymous access for public preview.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Client)]
    public async Task<ActionResult<List<WidgetDefinitionDto>>> GetAll([FromQuery] Guid? brandId, CancellationToken cancellationToken)
    {
        var widgets = await _widgetService.GetAllAsync(brandId, cancellationToken);
        return Ok(widgets);
    }

    /// <summary>
    /// Gets a widget definition by ID. Allows anonymous access for public preview.
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<WidgetDefinitionDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var widget = await _widgetService.GetByIdAsync(id, cancellationToken);
        return widget is null ? NotFound() : Ok(widget);
    }

    /// <summary>
    /// Gets all available versions for a widget by slug.
    /// </summary>
    [HttpGet("{slug}/versions")]
    [AllowAnonymous]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Client)]
    public async Task<ActionResult<List<WidgetVersionListItemDto>>> GetVersions(string slug, CancellationToken cancellationToken)
    {
        var versions = await _widgetService.GetVersionsAsync(slug, cancellationToken);
        return Ok(versions);
    }

    /// <summary>
    /// Gets a specific version of a widget by slug and version string.
    /// </summary>
    [HttpGet("{slug}/versions/{version}")]
    [AllowAnonymous]
    public async Task<ActionResult<WidgetVersionDto>> GetVersion(string slug, string version, CancellationToken cancellationToken)
    {
        var widgetVersion = await _widgetService.GetBySlugAndVersionAsync(slug, version, cancellationToken);
        return widgetVersion is null ? NotFound() : Ok(widgetVersion);
    }

    /// <summary>
    /// Gets all versions with full details for a widget by slug.
    /// </summary>
    [HttpGet("{slug}/versions/all")]
    [AllowAnonymous]
    public async Task<ActionResult<List<WidgetVersionDto>>> GetAllVersions(string slug, CancellationToken cancellationToken)
    {
        var versions = await _widgetService.GetAllVersionsAsync(slug, cancellationToken);
        return Ok(versions);
    }
}
