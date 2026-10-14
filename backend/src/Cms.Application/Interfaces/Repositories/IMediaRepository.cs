using Cms.Domain.Entities;

namespace Cms.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for MediaItem entity.
/// </summary>
public interface IMediaRepository
{
    Task<MediaItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<MediaItem>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<MediaItem> AddAsync(MediaItem entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(MediaItem entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(MediaItem entity, CancellationToken cancellationToken = default);
    Task DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<List<MediaItem>> GetByBrandIdAsync(Guid brandId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lists all media without loading <see cref="Cms.Domain.Entities.MediaItem.Content"/> (bytea).
    /// </summary>
    Task<List<MediaItem>> GetAllSummaryAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets metadata without loading <see cref="Cms.Domain.Entities.MediaItem.Content"/>.
    /// </summary>
    Task<MediaItem?> GetSummaryByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Loads a media row including <see cref="Cms.Domain.Entities.MediaItem.Content"/> for file streaming.
    /// </summary>
    Task<MediaItem?> GetByIdWithContentAsync(Guid id, CancellationToken cancellationToken = default);
}
