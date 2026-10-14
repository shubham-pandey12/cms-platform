using Cms.Domain.Entities;

namespace Cms.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for Template entity.
/// </summary>
public interface ITemplateRepository
{
    Task<Template?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<Template>> GetAllAsync(Guid? brandId, CancellationToken cancellationToken = default);
    Task<Template> AddAsync(Template entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(Template entity, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
