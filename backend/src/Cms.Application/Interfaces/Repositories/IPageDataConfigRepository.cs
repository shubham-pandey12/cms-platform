using Cms.Domain.Entities;

namespace Cms.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for PageDataConfig entity.
/// </summary>
public interface IPageDataConfigRepository
{
    Task<PageDataConfig?> GetByPageIdAsync(Guid pageId, CancellationToken cancellationToken = default);
}
