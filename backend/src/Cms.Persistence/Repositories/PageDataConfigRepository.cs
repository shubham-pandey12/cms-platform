using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories;
using Cms.Domain.Entities;

namespace Cms.Persistence.Repositories;

/// <summary>
/// Repository implementation for PageDataConfig entity.
/// </summary>
public sealed class PageDataConfigRepository : IPageDataConfigRepository
{
    private readonly CmsDbContext _context;

    public PageDataConfigRepository(CmsDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<PageDataConfig?> GetByPageIdAsync(Guid pageId, CancellationToken cancellationToken = default)
    {
        return await _context.PageDataConfigs
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PageId == pageId, cancellationToken);
    }
}
