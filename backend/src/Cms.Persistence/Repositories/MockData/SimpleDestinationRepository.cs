using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories.MockData;
using Cms.Domain.Entities.MockData;

namespace Cms.Persistence.Repositories.MockData;

/// <summary>
/// Repository implementation for SimpleDestination mock data.
/// </summary>
public sealed class SimpleDestinationRepository : ISimpleDestinationRepository
{
    private readonly CmsDbContext _context;

    public SimpleDestinationRepository(CmsDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<List<SimpleDestination>> GetAsync(bool? featured, int limit, CancellationToken cancellationToken = default)
    {
        var query = _context.SimpleDestinations.AsNoTracking();

        if (featured == true)
        {
            query = query.Where(d => d.Featured);
        }

        return await query.Take(limit).ToListAsync(cancellationToken);
    }
}
