using Cms.Domain.Entities.MockData;

namespace Cms.Application.Interfaces.Repositories.MockData;

/// <summary>
/// Read-only repository for GalleryImage mock data.
/// </summary>
public interface IGalleryImageRepository
{
    Task<List<GalleryImage>> GetPageAsync(int limit, int offset, CancellationToken cancellationToken = default);
    Task<int> GetCountAsync(CancellationToken cancellationToken = default);
}
