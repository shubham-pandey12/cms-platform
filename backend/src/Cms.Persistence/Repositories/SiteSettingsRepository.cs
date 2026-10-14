using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories;
using Cms.Domain.Entities;

namespace Cms.Persistence.Repositories;

/// <summary>
/// Repository implementation for SiteSettings entity.
/// </summary>
public sealed class SiteSettingsRepository : Repository<SiteSettings>, ISiteSettingsRepository
{
    public SiteSettingsRepository(CmsDbContext context)
        : base(context)
    {
    }

    /// <inheritdoc />
    public async Task<SiteSettings?> GetByBrandIdAsync(Guid brandId, CancellationToken cancellationToken = default)
    {
        return await DbSet.AsNoTracking()
            .FirstOrDefaultAsync(s => s.BrandId == brandId, cancellationToken);
    }
}
