using Cms.Domain.Entities;

namespace Cms.Application.Interfaces.Repositories;

/// <summary>
/// Repository for CMS redirect rules scoped by brand.
/// </summary>
public interface IRedirectRepository
{
    Task<List<Redirect>> GetByBrandIdAsync(Guid brandId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a redirect by id; optionally <paramref name="tracking"/> for updates/deletes.
    /// </summary>
    Task<Redirect?> GetByIdAndBrandIdAsync(Guid id, Guid brandId, bool tracking, CancellationToken cancellationToken = default);

    /// <summary>
    /// Finds a redirect by brand and stored <c>From</c> path (already normalized).
    /// </summary>
    Task<Redirect?> FindByBrandAndFromAsync(Guid brandId, string normalizedFrom, CancellationToken cancellationToken = default);

    Task<Redirect> AddAsync(Redirect entity, CancellationToken cancellationToken = default);

    Task UpdateAsync(Redirect entity, CancellationToken cancellationToken = default);

    Task DeleteAsync(Redirect entity, CancellationToken cancellationToken = default);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
