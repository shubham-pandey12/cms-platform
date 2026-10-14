using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories.MockData;
using Cms.Domain.Entities.MockData;

namespace Cms.Persistence.Repositories.MockData;

/// <summary>
/// Repository implementation for Destination mock data.
/// </summary>
public sealed class DestinationRepository : IDestinationRepository
{
    private readonly CmsDbContext _context;

    public DestinationRepository(CmsDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<List<Destination>> GetPageAsync(int limit, int offset, CancellationToken cancellationToken = default)
    {
        return await _context.Destinations
            .AsNoTracking()
            .OrderBy(d => d.Id)
            .Skip(offset)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public Task<int> GetCountAsync(CancellationToken cancellationToken = default)
    {
        return _context.Destinations.CountAsync(cancellationToken);
    }
}
