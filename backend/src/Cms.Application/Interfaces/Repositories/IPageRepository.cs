using Cms.Domain.Entities;

namespace Cms.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for Page entity with custom query methods.
/// </summary>
public interface IPageRepository
{
    Task<Page?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<Page>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Page> AddAsync(Page entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(Page entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(Page entity, CancellationToken cancellationToken = default);
    Task DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<Page?> GetByUriAsync(Guid brandId, string uri, CancellationToken cancellationToken = default);
    Task<List<Page>> GetByBrandIdAsync(Guid brandId, CancellationToken cancellationToken = default);
    Task<Page?> GetPublishedByUriAsync(Guid brandId, string uri, CancellationToken cancellationToken = default);
    Task<(Page? page, Dictionary<string, string> routeParams)> GetPublishedByDynamicUriAsync(Guid brandId, string uri, CancellationToken cancellationToken = default);

    /// <summary>
    /// Published static pages eligible for sitemap (not dynamic routes, not noindex).
    /// </summary>
    Task<List<Page>> GetPublishedStaticSitemapPagesAsync(Guid brandId, CancellationToken cancellationToken = default);
}
