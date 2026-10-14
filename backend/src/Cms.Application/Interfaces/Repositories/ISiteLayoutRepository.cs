using Cms.Domain.Entities;

namespace Cms.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for SiteLayout entity.
/// </summary>
public interface ISiteLayoutRepository
{
    Task<SiteLayout?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<SiteLayout>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<SiteLayout>> GetAllByBrandIdAsync(Guid? brandId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all layouts for a brand with change tracking (for updates).
    /// </summary>
    Task<List<SiteLayout>> GetTrackedByBrandIdAsync(Guid brandId, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<SiteLayout> AddAsync(SiteLayout entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(SiteLayout entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(SiteLayout entity, CancellationToken cancellationToken = default);
    Task DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
