using Cms.Domain.Entities;

namespace Cms.Application.Interfaces.Repositories;

/// <summary>
/// Repository for BrandDomain entity (domains belonging to a brand).
/// </summary>
public interface IBrandDomainRepository
{
    Task<List<BrandDomain>> GetByBrandIdAsync(Guid brandId, CancellationToken cancellationToken = default);
    Task<BrandDomain?> GetByDomainAsync(string domain, CancellationToken cancellationToken = default);
    Task<BrandDomain> AddAsync(BrandDomain entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(BrandDomain entity, CancellationToken cancellationToken = default);
}
