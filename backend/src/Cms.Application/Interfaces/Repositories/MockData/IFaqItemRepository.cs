using Cms.Domain.Entities.MockData;

namespace Cms.Application.Interfaces.Repositories.MockData;

/// <summary>
/// Read-only repository for FaqItem mock data.
/// </summary>
public interface IFaqItemRepository
{
    Task<List<FaqItem>> GetAllAsync(CancellationToken cancellationToken = default);
}
