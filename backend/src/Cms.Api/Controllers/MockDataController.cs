using Microsoft.AspNetCore.Mvc;
using Cms.Application.DTOs.MockData;
using Cms.Application.Interfaces.Services;

namespace Cms.Api.Controllers;

/// <summary>
/// Provides mock data endpoints for dynamic widgets.
/// </summary>
[ApiController]
[Route("api")]
public sealed class MockDataController : ControllerBase
{
    private readonly IMockDataService _mockDataService;

    public MockDataController(IMockDataService mockDataService)
    {
        _mockDataService = mockDataService;
    }

    /// <summary>
    /// Gets gallery images with pagination.
    /// </summary>
    [HttpGet("gallery/featured")]
    public async Task<ActionResult<GalleryResponse>> GetGalleryImages(
        [FromQuery] int limit = 12,
        [FromQuery] int offset = 0,
        CancellationToken cancellationToken = default)
    {
        var response = await _mockDataService.GetGalleryImagesAsync(limit, offset, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Gets featured destinations with pagination.
    /// </summary>
    [HttpGet("destinations/featured")]
    public async Task<ActionResult<DestinationsResponse>> GetFeaturedDestinations(
        [FromQuery] int limit = 8,
        [FromQuery] int offset = 0,
        CancellationToken cancellationToken = default)
    {
        var response = await _mockDataService.GetFeaturedDestinationsAsync(limit, offset, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Gets destinations list.
    /// </summary>
    [HttpGet("destinations")]
    public async Task<ActionResult<object>> GetDestinations(
        [FromQuery] bool featured = false,
        [FromQuery] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        var destinations = await _mockDataService.GetDestinationsAsync(featured, limit, cancellationToken);
        return Ok(new { destinations });
    }

    /// <summary>
    /// Gets FAQ items.
    /// </summary>
    [HttpGet("faq/general")]
    public async Task<ActionResult<FaqResponse>> GetFaqItems(CancellationToken cancellationToken = default)
    {
        var response = await _mockDataService.GetFaqItemsAsync(cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Gets featured travel packages.
    /// </summary>
    [HttpGet("packages/featured")]
    public async Task<ActionResult<PackagesResponse>> GetFeaturedPackages(
        [FromQuery] int limit = 6,
        CancellationToken cancellationToken = default)
    {
        var response = await _mockDataService.GetFeaturedPackagesAsync(limit, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Gets all packages (alias for featured endpoint to support legacy configs).
    /// </summary>
    [HttpGet("packages")]
    public async Task<ActionResult<PackagesResponse>> GetPackages(
        [FromQuery] int limit = 12,
        CancellationToken cancellationToken = default)
    {
        var response = await _mockDataService.GetPackagesAsync(limit, cancellationToken);
        return Ok(response);
    }
}
