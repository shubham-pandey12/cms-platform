using Cms.Domain.Entities.MockData;

namespace Cms.Application.Interfaces.Repositories.MockData;

/// <summary>
/// Read-only repository for TravelPackage mock data.
/// </summary>
public interface ITravelPackageRepository
{
    Task<List<TravelPackage>> GetAsync(int limit, CancellationToken cancellationToken = default);
}
