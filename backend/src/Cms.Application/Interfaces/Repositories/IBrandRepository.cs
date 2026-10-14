using Cms.Domain.Entities;

namespace Cms.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for Brand entity with custom query methods.
/// </summary>
public interface IBrandRepository
{
    Task<Brand?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<Brand>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Brand> AddAsync(Brand entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(Brand entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(Brand entity, CancellationToken cancellationToken = default);
    Task DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<Brand?> GetBySubdomainAsync(string subdomain, CancellationToken cancellationToken = default);
    /// <summary>
    /// Gets a brand by domain (case-insensitive). Used for uniqueness checks.
    /// </summary>
    Task<Brand?> GetByDomainAsync(string domain, CancellationToken cancellationToken = default);
    /// <summary>
    /// Gets the brand that owns the given host (domain, optionally with port stripped). Checks Brand.Domain and BrandDomains.
    /// </summary>
    Task<Brand?> GetByHostAsync(string host, CancellationToken cancellationToken = default);
    Task<List<Guid>> GetAllBrandIdsAsync(CancellationToken cancellationToken = default);
}
