using Cms.Application.DTOs.PageData;

namespace Cms.Application.Interfaces.Services;

/// <summary>
/// Service interface for page data (variables and API calls) operations.
/// </summary>
public interface IPageDataService
{
    Task<PageDataResponse> GetByPageIdAsync(Guid pageId, CancellationToken cancellationToken = default);
}
