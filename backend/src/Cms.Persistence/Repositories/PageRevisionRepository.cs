using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories;
using Cms.Domain.Entities;

namespace Cms.Persistence.Repositories;

/// <summary>
/// Repository implementation for PageRevision entity.
/// </summary>
public class PageRevisionRepository : Repository<PageRevision>, IPageRevisionRepository
{
    public PageRevisionRepository(CmsDbContext context) : base(context)
    {
    }

    /// <summary>
    /// Gets all revisions for a page, newest first.
    /// </summary>
    public async Task<List<PageRevision>> GetByPageIdAsync(Guid pageId, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .AsNoTracking()
            .Where(r => r.PageId == pageId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}

