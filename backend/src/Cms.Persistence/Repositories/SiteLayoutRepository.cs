using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories;
using Cms.Domain.Entities;

namespace Cms.Persistence.Repositories;

/// <summary>
/// Repository implementation for SiteLayout entity.
/// </summary>
public sealed class SiteLayoutRepository : Repository<SiteLayout>, ISiteLayoutRepository
{
    public SiteLayoutRepository(CmsDbContext context)
        : base(context)
    {
    }

    /// <inheritdoc />
    public async Task<List<SiteLayout>> GetAllByBrandIdAsync(Guid? brandId, CancellationToken cancellationToken = default)
    {
        var query = DbSet.AsNoTracking();

        if (brandId.HasValue)
        {
            query = query.Where(l => l.BrandId == brandId.Value);
        }

        return await query.OrderBy(l => l.Name).ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<List<SiteLayout>> GetTrackedByBrandIdAsync(Guid brandId, CancellationToken cancellationToken = default)
    {
        return await DbSet.Where(l => l.BrandId == brandId).ToListAsync(cancellationToken);
    }
}
