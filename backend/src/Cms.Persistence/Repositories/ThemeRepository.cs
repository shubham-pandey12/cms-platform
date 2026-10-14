using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories;
using Cms.Domain.Entities;

namespace Cms.Persistence.Repositories;

/// <summary>
/// Repository implementation for Theme entity.
/// </summary>
public sealed class ThemeRepository : Repository<Theme>, IThemeRepository
{
    public ThemeRepository(CmsDbContext context)
        : base(context)
    {
    }

    /// <inheritdoc />
    public async Task<List<Theme>> GetAllByBrandIdAsync(Guid? brandId, CancellationToken cancellationToken = default)
    {
        var query = DbSet.AsNoTracking();

        if (brandId.HasValue)
        {
            query = query.Where(t => t.BrandId == null || t.BrandId == brandId.Value);
        }

        return await query
            .OrderByDescending(t => t.IsDefault)
            .ThenBy(t => t.Name)
            .ToListAsync(cancellationToken);
    }
}
