using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cms.Application.Common.Security;
using Cms.Application.DTOs.Themes.Requests;
using Cms.Application.DTOs.Themes.Responses;
using Cms.Application.Interfaces.Services;

namespace Cms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class ThemesController : ControllerBase
{
    private readonly IThemeService _themeService;

    public ThemesController(IThemeService themeService)
    {
        _themeService = themeService;
    }

    /// <summary>
    /// Gets all themes, optionally filtered by brand. Allows anonymous access for public preview.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Client)]
    public async Task<ActionResult<List<ThemeDto>>> GetAll([FromQuery] Guid? brandId, CancellationToken cancellationToken)
    {
        var themes = await _themeService.GetAllAsync(brandId, cancellationToken);
        return Ok(themes);
    }

    /// <summary>
    /// Gets a theme by ID. Allows anonymous access for public preview.
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<ThemeDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var theme = await _themeService.GetByIdAsync(id, cancellationToken);
        return theme is null ? NotFound() : Ok(theme);
    }

    /// <summary>
    /// Creates a new theme.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = PolicyCatalog.ThemesManage)]
    public async Task<ActionResult<ThemeDto>> Create([FromBody] CreateThemeRequest request, CancellationToken cancellationToken)
    {
        var theme = await _themeService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = theme.Id }, theme);
    }

    /// <summary>
    /// Deletes a theme.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = PolicyCatalog.ThemesDelete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var deleted = await _themeService.DeleteAsync(id, cancellationToken);
            return deleted ? NoContent() : NotFound();
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("default theme"))
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
