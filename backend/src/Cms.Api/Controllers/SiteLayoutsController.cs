using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cms.Application.DTOs.SiteLayouts.Requests;
using Cms.Application.DTOs.SiteLayouts.Responses;
using Cms.Application.Interfaces.Services;
using System.Security.Claims;

namespace Cms.Api.Controllers;

[ApiController]
[Route("api/site-layouts")]
[Authorize]
public sealed class SiteLayoutsController : ControllerBase
{
    private readonly ISiteLayoutService _siteLayoutService;

    public SiteLayoutsController(ISiteLayoutService siteLayoutService)
    {
        _siteLayoutService = siteLayoutService;
    }

    /// <summary>
    /// Gets all site layouts, optionally filtered by brand. Allows anonymous access for public preview.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<SiteLayoutDto>>> GetAll([FromQuery] Guid? brandId, CancellationToken cancellationToken)
    {
        var layouts = await _siteLayoutService.GetAllAsync(brandId, cancellationToken);
        return Ok(layouts);
    }

    /// <summary>
    /// Gets a site layout by ID. Allows anonymous access for public preview.
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<SiteLayoutDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var layout = await _siteLayoutService.GetByIdAsync(id, cancellationToken);
        return layout is null ? NotFound() : Ok(layout);
    }

    /// <summary>
    /// Creates a new site layout.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SiteLayoutDto>> Create([FromBody] CreateSiteLayoutRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var layout = await _siteLayoutService.CreateAsync(request, userId, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = layout.Id }, layout);
    }

    /// <summary>
    /// Updates a site layout.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SiteLayoutDto>> Update(Guid id, [FromBody] UpdateSiteLayoutRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var layout = await _siteLayoutService.UpdateAsync(id, request, userId, cancellationToken);
        return layout is null ? NotFound() : Ok(layout);
    }

    /// <summary>
    /// Deletes a site layout.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _siteLayoutService.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
