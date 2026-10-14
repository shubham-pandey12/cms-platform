using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cms.Application.Common.Security;
using Cms.Application.DTOs.Redirects;
using Cms.Application.Interfaces.Services;

namespace Cms.Api.Controllers;

/// <summary>
/// Brand-scoped URL redirects (CRUD + public resolve for storefront middleware).
/// </summary>
[ApiController]
[Route("api/brands/{brandId:guid}/redirects")]
public sealed class BrandsRedirectsController : ControllerBase
{
    private readonly IRedirectService _redirectService;

    public BrandsRedirectsController(IRedirectService redirectService)
    {
        _redirectService = redirectService;
    }

    /// <summary>
    /// Resolves a redirect for the given path, or 404 if none. Anonymous for Next.js middleware.
    /// </summary>
    [HttpGet("resolve")]
    [AllowAnonymous]
    public async Task<ActionResult<RedirectResolveDto>> Resolve(
        Guid brandId,
        [FromQuery] string? path,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _redirectService.ResolveAsync(brandId, path ?? "/", cancellationToken);
            return result is null ? NotFound() : Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Lists all redirects for a brand.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = PolicyCatalog.RedirectsManage)]
    public async Task<ActionResult<IReadOnlyList<RedirectDto>>> GetList(Guid brandId, CancellationToken cancellationToken)
    {
        try
        {
            var list = await _redirectService.ListByBrandAsync(brandId, cancellationToken);
            return Ok(list);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Creates a redirect rule.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = PolicyCatalog.RedirectsManage)]
    public async Task<ActionResult<RedirectDto>> Create(
        Guid brandId,
        [FromBody] CreateRedirectRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var created = await _redirectService.CreateAsync(brandId, request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { brandId, id = created.Id }, created);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Gets a single redirect by id.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = PolicyCatalog.RedirectsManage)]
    public async Task<ActionResult<RedirectDto>> GetById(Guid brandId, Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var dto = await _redirectService.GetAsync(brandId, id, cancellationToken);
            return dto is null ? NotFound() : Ok(dto);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Updates a redirect rule.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = PolicyCatalog.RedirectsManage)]
    public async Task<ActionResult<RedirectDto>> Update(
        Guid brandId,
        Guid id,
        [FromBody] UpdateRedirectRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var dto = await _redirectService.UpdateAsync(brandId, id, request, cancellationToken);
            return dto is null ? NotFound() : Ok(dto);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Deletes a redirect rule.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = PolicyCatalog.RedirectsManage)]
    public async Task<IActionResult> Delete(Guid brandId, Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var deleted = await _redirectService.DeleteAsync(brandId, id, cancellationToken);
            return deleted ? NoContent() : NotFound();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
