using Cms.Domain.Entities.MockData;

namespace Cms.Application.Interfaces.Repositories.MockData;

/// <summary>
/// Read-only repository for SimpleDestination mock data.
/// </summary>
public interface ISimpleDestinationRepository
{
    Task<List<SimpleDestination>> GetAsync(bool? featured, int limit, CancellationToken cancellationToken = default);
}
