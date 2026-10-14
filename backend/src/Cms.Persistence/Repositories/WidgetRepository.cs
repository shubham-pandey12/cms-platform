using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories;
using Cms.Domain.Entities;

namespace Cms.Persistence.Repositories;

/// <summary>
/// Repository implementation for WidgetDefinition entity.
/// </summary>
public class WidgetRepository : Repository<WidgetDefinition>, IWidgetRepository
{
    public WidgetRepository(CmsDbContext context) : base(context)
    {
    }

    public async Task<List<WidgetDefinition>> GetByBrandIdAsync(Guid? brandId, CancellationToken cancellationToken = default)
    {
        var query = DbSet.AsNoTracking().OrderBy(w => w.Category).ThenBy(w => w.Name);

        if (brandId.HasValue)
        {
            return await query
                .Where(w => w.BrandIds.Count == 0 || w.BrandIds.Contains(brandId.Value))
                .ToListAsync(cancellationToken);
        }

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<List<WidgetDefinitionVersion>> GetVersionsBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default)
    {
        return await Context.WidgetDefinitionVersions
            .AsNoTracking()
            .Where(v => v.Slug == slug)
            .OrderByDescending(v => v.IsLatest)
            .ThenByDescending(v => v.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<WidgetDefinitionVersion?> GetVersionAsync(
        string slug,
        string version,
        CancellationToken cancellationToken = default)
    {
        return await Context.WidgetDefinitionVersions
            .AsNoTracking()
            .FirstOrDefaultAsync(
                v => v.Slug == slug && v.Version == version,
                cancellationToken);
    }

    public async Task<WidgetDefinitionVersion?> GetVersionByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await Context.WidgetDefinitionVersions
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
    }
}

