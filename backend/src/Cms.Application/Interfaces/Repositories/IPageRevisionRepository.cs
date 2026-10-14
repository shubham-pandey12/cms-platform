using Cms.Domain.Entities;

namespace Cms.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for PageRevision entity.
/// </summary>
public interface IPageRevisionRepository
{
    Task<PageRevision?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<PageRevision>> GetByPageIdAsync(Guid pageId, CancellationToken cancellationToken = default);
    Task<List<PageRevision>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PageRevision> AddAsync(PageRevision entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(PageRevision entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(PageRevision entity, CancellationToken cancellationToken = default);
    Task DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
