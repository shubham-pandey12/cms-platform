using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories;
using Cms.Domain.Entities;

namespace Cms.Persistence.Repositories;

/// <summary>
/// Repository implementation for Template entity.
/// </summary>
public sealed class TemplateRepository : Repository<Template>, ITemplateRepository
{
    public TemplateRepository(CmsDbContext context)
        : base(context)
    {
    }

    /// <inheritdoc />
    public async Task<List<Template>> GetAllAsync(Guid? brandId, CancellationToken cancellationToken = default)
    {
        var query = DbSet.AsNoTracking();

        if (brandId.HasValue)
        {
            query = query.Where(t => t.BrandId == null || t.BrandId == brandId.Value);
        }

        return await query.OrderBy(t => t.Name).ToListAsync(cancellationToken);
    }
}
