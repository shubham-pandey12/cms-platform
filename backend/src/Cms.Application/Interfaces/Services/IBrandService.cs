using Cms.Application.DTOs.Brands.Requests;
using Cms.Application.DTOs.Brands.Responses;

namespace Cms.Application.Interfaces.Services;

/// <summary>
/// Service interface for brand operations.
/// </summary>
public interface IBrandService
{
    Task<List<BrandDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<BrandDto?> GetByIdOrSlugAsync(string idOrSlug, CancellationToken cancellationToken = default);
    /// <summary>
    /// Gets the brand that owns the given host (domain). Used for host-based site resolution.
    /// </summary>
    Task<BrandDto?> GetByHostAsync(string host, CancellationToken cancellationToken = default);
    /// <summary>
    /// Checks whether the given domain and subdomain are available. When editing, pass the current brand id to exclude it from the check.
    /// </summary>
    Task<BrandAvailabilityResponse> CheckAvailabilityAsync(string? domain, string? subdomain, Guid? excludeBrandId, CancellationToken cancellationToken = default);
    Task<BrandDto> CreateAsync(CreateBrandRequest request, Guid? createdByUserId = null, CancellationToken cancellationToken = default);
    Task<BrandDto> UpdateAsync(Guid id, UpdateBrandRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<string>> GetDomainsAsync(Guid brandId, CancellationToken cancellationToken = default);
    Task AddDomainAsync(Guid brandId, string domain, CancellationToken cancellationToken = default);
    Task RemoveDomainAsync(Guid brandId, string domain, CancellationToken cancellationToken = default);
}

