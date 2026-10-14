using Cms.Domain.Entities;

namespace Cms.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for Theme entity.
/// </summary>
public interface IThemeRepository
{
    Task<Theme?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<Theme>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<Theme>> GetAllByBrandIdAsync(Guid? brandId, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Theme> AddAsync(Theme entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(Theme entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(Theme entity, CancellationToken cancellationToken = default);
    Task DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
