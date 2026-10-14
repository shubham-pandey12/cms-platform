using Cms.Domain.Entities;

namespace Cms.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for SiteSettings entity.
/// </summary>
public interface ISiteSettingsRepository
{
    Task<SiteSettings?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<SiteSettings?> GetByBrandIdAsync(Guid brandId, CancellationToken cancellationToken = default);
    Task<List<SiteSettings>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<SiteSettings> AddAsync(SiteSettings entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(SiteSettings entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(SiteSettings entity, CancellationToken cancellationToken = default);
    Task DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
