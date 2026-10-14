using Cms.Domain.Entities.MockData;

namespace Cms.Application.Interfaces.Repositories.MockData;

/// <summary>
/// Read-only repository for Destination mock data.
/// </summary>
public interface IDestinationRepository
{
    Task<List<Destination>> GetPageAsync(int limit, int offset, CancellationToken cancellationToken = default);
    Task<int> GetCountAsync(CancellationToken cancellationToken = default);
}
