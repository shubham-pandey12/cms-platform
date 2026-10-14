using Cms.Application.DTOs.MockData;

namespace Cms.Application.Interfaces.Services;

/// <summary>
/// Service interface for mock data used by dynamic widgets.
/// </summary>
public interface IMockDataService
{
    Task<GalleryResponse> GetGalleryImagesAsync(int limit, int offset, CancellationToken cancellationToken = default);
    Task<DestinationsResponse> GetFeaturedDestinationsAsync(int limit, int offset, CancellationToken cancellationToken = default);
    Task<List<SimpleDestinationDto>> GetDestinationsAsync(bool featured, int limit, CancellationToken cancellationToken = default);
    Task<FaqResponse> GetFaqItemsAsync(CancellationToken cancellationToken = default);
    Task<PackagesResponse> GetFeaturedPackagesAsync(int limit, CancellationToken cancellationToken = default);
    Task<PackagesResponse> GetPackagesAsync(int limit, CancellationToken cancellationToken = default);
}
