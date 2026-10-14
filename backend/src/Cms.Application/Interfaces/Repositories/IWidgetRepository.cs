using Cms.Domain.Entities;

namespace Cms.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for WidgetDefinition entity.
/// </summary>
public interface IWidgetRepository
{
    Task<WidgetDefinition?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<WidgetDefinition>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<WidgetDefinition> AddAsync(WidgetDefinition entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(WidgetDefinition entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(WidgetDefinition entity, CancellationToken cancellationToken = default);
    Task DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<List<WidgetDefinition>> GetByBrandIdAsync(Guid? brandId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all versions for a widget by slug.
    /// </summary>
    Task<List<WidgetDefinitionVersion>> GetVersionsBySlugAsync(string slug, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a specific version by slug and version string.
    /// </summary>
    Task<WidgetDefinitionVersion?> GetVersionAsync(string slug, string version, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a version by its ID.
    /// </summary>
    Task<WidgetDefinitionVersion?> GetVersionByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
