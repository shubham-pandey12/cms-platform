using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories.MockData;
using Cms.Domain.Entities.MockData;

namespace Cms.Persistence.Repositories.MockData;

/// <summary>
/// Repository implementation for FaqItem mock data.
/// </summary>
public sealed class FaqItemRepository : IFaqItemRepository
{
    private readonly CmsDbContext _context;

    public FaqItemRepository(CmsDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<List<FaqItem>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.FaqItems.AsNoTracking().ToListAsync(cancellationToken);
    }
}
