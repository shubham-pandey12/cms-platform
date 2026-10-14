using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories.MockData;
using Cms.Domain.Entities.MockData;

namespace Cms.Persistence.Repositories.MockData;

/// <summary>
/// Repository implementation for GalleryImage mock data.
/// </summary>
public sealed class GalleryImageRepository : IGalleryImageRepository
{
    private readonly CmsDbContext _context;

    public GalleryImageRepository(CmsDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<List<GalleryImage>> GetPageAsync(int limit, int offset, CancellationToken cancellationToken = default)
    {
        return await _context.GalleryImages
            .AsNoTracking()
            .OrderBy(i => i.Id)
            .Skip(offset)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public Task<int> GetCountAsync(CancellationToken cancellationToken = default)
    {
        return _context.GalleryImages.CountAsync(cancellationToken);
    }
}
