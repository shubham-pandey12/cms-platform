using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cms.Application.DTOs.PageData;
using Cms.Application.Interfaces.Services;

namespace Cms.Api.Controllers;

/// <summary>
/// Exposes page data configurations (variables and API calls) for pages.
/// </summary>
[ApiController]
[Route("api/page-data")]
public sealed class PageDataController : ControllerBase
{
    private readonly IPageDataService _pageDataService;

    public PageDataController(IPageDataService pageDataService)
    {
        _pageDataService = pageDataService;
    }

    /// <summary>
    /// Gets page data (variables and API calls) for a page.
    /// </summary>
    [HttpGet("{pageId:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<PageDataResponse>> GetByPageId(Guid pageId, CancellationToken cancellationToken)
    {
        var response = await _pageDataService.GetByPageIdAsync(pageId, cancellationToken);
        return Ok(response);
    }
}
