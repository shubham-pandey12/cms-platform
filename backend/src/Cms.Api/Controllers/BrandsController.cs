using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cms.Application.Common.Security;
using Cms.Application.DTOs.Brands.Requests;
using Cms.Application.DTOs.Brands.Responses;
using Cms.Application.Interfaces.Services;

namespace Cms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class BrandsController : ControllerBase
{
    private readonly IBrandService _brandService;
    private readonly IPageService _pageService;
    private readonly ISiteSettingsService _siteSettingsService;

    public BrandsController(IBrandService brandService, IPageService pageService, ISiteSettingsService siteSettingsService)
    {
        _brandService = brandService;
        _pageService = pageService;
        _siteSettingsService = siteSettingsService;
    }

    /// <summary>
    /// Gets all brands.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = PolicyCatalog.BrandsManage)]
    public async Task<ActionResult<List<BrandDto>>> GetAll(CancellationToken cancellationToken)
    {
        var brands = await _brandService.GetAllAsync(cancellationToken);
        return Ok(brands);
    }

    /// <summary>
    /// Checks whether domain and subdomain are available. For edit mode, pass excludeBrandId to ignore the current brand.
    /// </summary>
    [HttpGet("check-availability")]
    [Authorize(Policy = PolicyCatalog.BrandsManage)]
    public async Task<ActionResult<BrandAvailabilityResponse>> CheckAvailability(
        [FromQuery] string? domain,
        [FromQuery] string? subdomain,
        [FromQuery] Guid? excludeBrandId,
        CancellationToken cancellationToken)
    {
        var result = await _brandService.CheckAvailabilityAsync(domain, subdomain, excludeBrandId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Gets the brand that owns the given host (for host-based site resolution). Allows anonymous access.
    /// When called from behind a proxy, request host is taken from X-Forwarded-Host. Pass ?host= for server-side calls.
    /// </summary>
    [HttpGet("by-host")]
    [AllowAnonymous]
    public async Task<ActionResult<BrandDto>> GetByHost([FromQuery] string? host, CancellationToken cancellationToken)
    {
        var hostToUse = !string.IsNullOrWhiteSpace(host) ? host : Request.Host.Host;
        if (string.IsNullOrWhiteSpace(hostToUse))
            return NotFound();
        var brand = await _brandService.GetByHostAsync(hostToUse, cancellationToken);
        return brand is null ? NotFound() : Ok(brand);
    }

    /// <summary>
    /// XML sitemap for published static indexable pages. Anonymous; base URL from site canonical or forwarded headers.
    /// <paramref name="brandIdOrSlug"/> may be a brand id, subdomain slug, or hostname (e.g. custom domain) so preview URLs like /preview/uat.example.com/sitemap.xml resolve.
    /// </summary>
    [HttpGet("{brandIdOrSlug}/sitemap.xml")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSitemapXml(string brandIdOrSlug, CancellationToken cancellationToken)
    {
        var brand = await ResolveBrandForSitemapAsync(brandIdOrSlug, cancellationToken);
        if (brand is null)
        {
            return NotFound();
        }

        var baseUrl = await ResolveSitemapBaseUrlAsync(brand.Id, cancellationToken);
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            return BadRequest("Could not resolve public base URL for sitemap.");
        }

        var xml = await _pageService.GetSitemapXmlAsync(brand.Id, baseUrl, cancellationToken);
        return Content(xml, "application/xml");
    }

    private async Task<BrandDto?> ResolveBrandForSitemapAsync(string brandIdOrSlug, CancellationToken cancellationToken)
    {
        var brand = await _brandService.GetByIdOrSlugAsync(brandIdOrSlug, cancellationToken);
        if (brand is not null)
        {
            return brand;
        }

        if (brandIdOrSlug.Contains('.'))
        {
            return await _brandService.GetByHostAsync(brandIdOrSlug, cancellationToken);
        }

        return null;
    }

    /// <summary>
    /// Gets a brand by ID or subdomain (slug). Allows anonymous access for public preview.
    /// </summary>
    [HttpGet("{idOrSlug}")]
    [AllowAnonymous]
    public async Task<ActionResult<BrandDto>> GetById(string idOrSlug, CancellationToken cancellationToken)
    {
        var brand = await _brandService.GetByIdOrSlugAsync(idOrSlug, cancellationToken);
        return brand is null ? NotFound() : Ok(brand);
    }

    /// <summary>
    /// Creates a new brand.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = PolicyCatalog.BrandsManage)]
    public async Task<ActionResult<BrandDto>> Create([FromBody] CreateBrandRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var createdBy = Guid.TryParse(userIdClaim, out var uid) ? uid : (Guid?)null;
        var brand = await _brandService.CreateAsync(request, createdBy, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { idOrSlug = brand.Id }, brand);
    }

    /// <summary>
    /// Updates an existing brand.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = PolicyCatalog.BrandsManage)]
    public async Task<ActionResult<BrandDto>> Update(Guid id, [FromBody] UpdateBrandRequest request, CancellationToken cancellationToken)
    {
        var brand = await _brandService.UpdateAsync(id, request, cancellationToken);
        return Ok(brand);
    }

    /// <summary>
    /// Deletes a brand.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = PolicyCatalog.BrandsManage)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _brandService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Gets all domains for a brand.
    /// </summary>
    [HttpGet("{id:guid}/domains")]
    [Authorize(Policy = PolicyCatalog.BrandsManage)]
    public async Task<ActionResult<List<string>>> GetDomains(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var domains = await _brandService.GetDomainsAsync(id, cancellationToken);
            return Ok(domains);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Adds a domain to a brand.
    /// </summary>
    [HttpPost("{id:guid}/domains")]
    [Authorize(Policy = PolicyCatalog.BrandsManage)]
    public async Task<IActionResult> AddDomain(Guid id, [FromBody] AddBrandDomainRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request?.Domain))
            return BadRequest("Domain is required.");
        try
        {
            await _brandService.AddDomainAsync(id, request.Domain, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Removes a domain from a brand.
    /// </summary>
    [HttpDelete("{id:guid}/domains/{domain}")]
    [Authorize(Policy = PolicyCatalog.BrandsManage)]
    public async Task<IActionResult> RemoveDomain(Guid id, string domain, CancellationToken cancellationToken)
    {
        try
        {
            await _brandService.RemoveDomainAsync(id, domain, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private async Task<string?> ResolveSitemapBaseUrlAsync(Guid brandId, CancellationToken cancellationToken)
    {
        var settings = await _siteSettingsService.GetByBrandIdOrSlugAsync(brandId.ToString(), cancellationToken);
        if (settings is not null && !string.IsNullOrWhiteSpace(settings.CanonicalUrl))
        {
            return NormalizeCanonicalSiteBase(settings.CanonicalUrl);
        }

        return ResolveBaseUrlFromRequest();
    }

    private static string NormalizeCanonicalSiteBase(string canonicalUrl)
    {
        var t = canonicalUrl.Trim();
        if (Uri.TryCreate(t, UriKind.Absolute, out _))
        {
            return t.TrimEnd('/');
        }

        return t.TrimEnd('/');
    }

    private string? ResolveBaseUrlFromRequest()
    {
        // Next.js server-side proxy must not send X-Forwarded-Proto/Host to this API: UseForwardedHeaders +
        // UseHttpsRedirection would treat X-Forwarded-Proto: http as HTTP and redirect in a loop. Use these instead.
        var sitemapHost = Request.Headers["X-Sitemap-Public-Host"].FirstOrDefault();
        var sitemapProto = Request.Headers["X-Sitemap-Public-Proto"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(sitemapHost) && !string.IsNullOrWhiteSpace(sitemapProto))
        {
            var scheme = sitemapProto.Split(',')[0].Trim();
            if (string.IsNullOrWhiteSpace(scheme))
            {
                scheme = "https";
            }

            var authority = sitemapHost.Trim();
            return $"{scheme}://{authority}".TrimEnd('/');
        }

        var forwardedHost = Request.Headers["X-Forwarded-Host"].FirstOrDefault();
        var hostHeader = !string.IsNullOrWhiteSpace(forwardedHost)
            ? forwardedHost.Split(':')[0].Trim()
            : Request.Host.Host;
        if (string.IsNullOrWhiteSpace(hostHeader))
        {
            return null;
        }

        var forwardedProto = Request.Headers["X-Forwarded-Proto"].FirstOrDefault();
        var scheme2 = !string.IsNullOrWhiteSpace(forwardedProto)
            ? forwardedProto.Split(',')[0].Trim()
            : Request.Scheme;
        if (string.IsNullOrWhiteSpace(scheme2))
        {
            scheme2 = "https";
        }

        return $"{scheme2}://{hostHeader}";
    }
}
