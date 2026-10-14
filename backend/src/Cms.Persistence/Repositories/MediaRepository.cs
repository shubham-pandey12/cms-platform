using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories;
using Cms.Domain.Entities;

namespace Cms.Persistence.Repositories;

/// <summary>
/// Repository implementation for MediaItem entity.
/// </summary>
public class MediaRepository : Repository<MediaItem>, IMediaRepository
{
    public MediaRepository(CmsDbContext context) : base(context)
    {
    }

    public async Task<List<MediaItem>> GetByBrandIdAsync(Guid brandId, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .AsNoTracking()
            .Where(m => m.BrandId == brandId)
            .OrderByDescending(m => m.UploadedAt)
            .Select(SelectSummaryWithoutContent())
            .ToListAsync(cancellationToken);
    }

    public async Task<List<MediaItem>> GetAllSummaryAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet
            .AsNoTracking()
            .OrderByDescending(m => m.UploadedAt)
            .Select(SelectSummaryWithoutContent())
            .ToListAsync(cancellationToken);
    }

    public async Task<MediaItem?> GetSummaryByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .AsNoTracking()
            .Where(m => m.Id == id)
            .Select(SelectSummaryWithoutContent())
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<MediaItem?> GetByIdWithContentAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
    }

    /// <summary>
    /// Projects metadata columns only so EF does not load bytea for list/detail DTOs.
    /// </summary>
    private static System.Linq.Expressions.Expression<Func<MediaItem, MediaItem>> SelectSummaryWithoutContent()
    {
        return m => new MediaItem
        {
            Id = m.Id,
            Name = m.Name,
            Url = m.Url,
            Thumbnail = m.Thumbnail,
            Type = m.Type,
            Size = m.Size,
            BrandId = m.BrandId,
            Folder = m.Folder,
            Alt = m.Alt,
            UploadedBy = m.UploadedBy,
            UploadedAt = m.UploadedAt,
            StorageProvider = m.StorageProvider,
            Content = null,
            ContentType = m.ContentType,
            BlobContainer = m.BlobContainer,
            BlobKey = m.BlobKey,
            Brand = null!,
        };
    }
}
