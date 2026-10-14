using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories.MockData;
using Cms.Domain.Entities.MockData;

namespace Cms.Persistence.Repositories.MockData;

/// <summary>
/// Repository implementation for TravelPackage mock data.
/// </summary>
public sealed class TravelPackageRepository : ITravelPackageRepository
{
    private readonly CmsDbContext _context;

    public TravelPackageRepository(CmsDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<List<TravelPackage>> GetAsync(int limit, CancellationToken cancellationToken = default)
    {
        return await _context.TravelPackages
            .AsNoTracking()
            .Take(limit)
            .ToListAsync(cancellationToken);
    }
}
