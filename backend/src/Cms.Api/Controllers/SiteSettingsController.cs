using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cms.Application.DTOs.SiteSettings;
using Cms.Application.Interfaces.Services;

namespace Cms.Api.Controllers;

/// <summary>
/// Exposes site settings per brand.
/// </summary>
[ApiController]
[Route("api/site-settings")]
public sealed class SiteSettingsController : ControllerBase
{
    private readonly ISiteSettingsService _siteSettingsService;

    public SiteSettingsController(ISiteSettingsService siteSettingsService)
    {
        _siteSettingsService = siteSettingsService;
    }

    /// <summary>
    /// Gets site settings by brand.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<SiteSettingsDto>> GetByBrand([FromQuery] string brandIdOrSlug, CancellationToken cancellationToken)
    {
        var settings = await _siteSettingsService.GetByBrandIdOrSlugAsync(brandIdOrSlug, cancellationToken);
        return settings is null ? NotFound() : Ok(settings);
    }

    /// <summary>
    /// Updates site settings.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<SiteSettingsDto>> Update(Guid id, [FromBody] UpdateSiteSettingsRequest request, CancellationToken cancellationToken)
    {
        var settings = await _siteSettingsService.UpdateAsync(id, request, cancellationToken);
        return settings is null ? NotFound() : Ok(settings);
    }
}
