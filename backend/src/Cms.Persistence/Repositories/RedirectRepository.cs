using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories;
using Cms.Domain.Entities;

namespace Cms.Persistence.Repositories;

/// <summary>
/// EF Core repository for <see cref="Redirect"/> entities.
/// </summary>
public sealed class RedirectRepository : Repository<Redirect>, IRedirectRepository
{
    public RedirectRepository(CmsDbContext context) : base(context)
    {
    }

    /// <inheritdoc />
    public async Task<List<Redirect>> GetByBrandIdAsync(Guid brandId, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .AsNoTracking()
            .Where(r => r.BrandId == brandId)
            .OrderBy(r => r.From)
            .ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<Redirect?> GetByIdAndBrandIdAsync(Guid id, Guid brandId, bool tracking, CancellationToken cancellationToken = default)
    {
        var query = DbSet.Where(r => r.Id == id && r.BrandId == brandId);
        return tracking
            ? await query.FirstOrDefaultAsync(cancellationToken)
            : await query.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<Redirect?> FindByBrandAndFromAsync(Guid brandId, string normalizedFrom, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.BrandId == brandId && r.From == normalizedFrom, cancellationToken);
    }
}
