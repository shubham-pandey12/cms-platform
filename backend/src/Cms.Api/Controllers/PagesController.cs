using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cms.Application.DTOs.Pages.Requests;
using Cms.Application.DTOs.Pages.Responses;
using Cms.Application.Interfaces.Services;
using System.Security.Claims;

namespace Cms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class PagesController : ControllerBase
{
    private readonly IPageService _pageService;

    public PagesController(IPageService pageService)
    {
        _pageService = pageService;
    }

    /// <summary>
    /// Gets all pages, optionally filtered by brand.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PageDto>>> GetAll([FromQuery] Guid? brandId, CancellationToken cancellationToken)
    {
        var pages = await _pageService.GetAllAsync(brandId, cancellationToken);
        return Ok(pages);
    }

    /// <summary>
    /// Gets a page by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PageDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var page = await _pageService.GetByIdAsync(id, cancellationToken);
        return page is null ? NotFound() : Ok(page);
    }

    /// <summary>
    /// Gets all revisions for a page (newest first).
    /// </summary>
    [HttpGet("{id:guid}/revisions")]
    public async Task<ActionResult<List<PageRevisionDto>>> GetRevisions(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var revisions = await _pageService.GetRevisionsAsync(id, cancellationToken);
            return Ok(revisions);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Gets a single revision's full content for loading into the editor (e.g. edit older version).
    /// </summary>
    [HttpGet("{pageId:guid}/revisions/{revisionId:guid}")]
    public async Task<ActionResult<PageRevisionDetailDto>> GetRevisionById(Guid pageId, Guid revisionId, CancellationToken cancellationToken)
    {
        var revision = await _pageService.GetRevisionByIdAsync(pageId, revisionId, cancellationToken);
        return revision is null ? NotFound() : Ok(revision);
    }

    /// <summary>
    /// Gets a page by URI within a brand.
    /// </summary>
    [HttpGet("by-uri")]
    [AllowAnonymous]
    public async Task<ActionResult<PageDto>> GetByUri([FromQuery] string brandIdOrSlug, [FromQuery] string uri, CancellationToken cancellationToken)
    {
        var page = await _pageService.GetByUriAsync(brandIdOrSlug, uri, cancellationToken);
        return page is null ? NotFound() : Ok(page);
    }

    /// <summary>
    /// Creates a new page.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<PageDto>> Create([FromBody] CreatePageRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var page = await _pageService.CreateAsync(request, userId, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = page.Id }, page);
    }

    /// <summary>
    /// Updates an existing page.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PageDto>> Update(Guid id, [FromBody] UpdatePageRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var page = await _pageService.UpdateAsync(id, request, userId, cancellationToken);
        return Ok(page);
    }

    /// <summary>
    /// Publishes a page with the given semantic version. Optionally set an existing revision as published by sending revisionId.
    /// </summary>
    [HttpPost("{id:guid}/publish")]
    public async Task<ActionResult<PageDto>> Publish(Guid id, [FromBody] PublishPageRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try
        {
            var page = await _pageService.PublishAsync(id, request, userId, cancellationToken);
            return Ok(page);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Deletes a page.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _pageService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
