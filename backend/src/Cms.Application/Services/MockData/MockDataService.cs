using Microsoft.Extensions.Logging;
using Cms.Application.DTOs.MockData;
using Cms.Application.Interfaces.Repositories.MockData;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Entities.MockData;

namespace Cms.Application.Services.MockData;

/// <summary>
/// Service for mock data used by dynamic widgets.
/// </summary>
public sealed class MockDataService : IMockDataService
{
    private readonly IGalleryImageRepository _galleryImageRepository;
    private readonly IDestinationRepository _destinationRepository;
    private readonly ISimpleDestinationRepository _simpleDestinationRepository;
    private readonly IFaqItemRepository _faqItemRepository;
    private readonly ITravelPackageRepository _travelPackageRepository;
    private readonly ILogger<MockDataService> _logger;

    public MockDataService(
        IGalleryImageRepository galleryImageRepository,
        IDestinationRepository destinationRepository,
        ISimpleDestinationRepository simpleDestinationRepository,
        IFaqItemRepository faqItemRepository,
        ITravelPackageRepository travelPackageRepository,
        ILogger<MockDataService> logger)
    {
        _galleryImageRepository = galleryImageRepository;
        _destinationRepository = destinationRepository;
        _simpleDestinationRepository = simpleDestinationRepository;
        _faqItemRepository = faqItemRepository;
        _travelPackageRepository = travelPackageRepository;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<GalleryResponse> GetGalleryImagesAsync(int limit, int offset, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Mock gallery requested. Limit={Limit}, Offset={Offset}", limit, offset);
        var (images, total) = await GetPageWithCountAsync(_galleryImageRepository.GetPageAsync, _galleryImageRepository.GetCountAsync, limit, offset, cancellationToken);
        var dtos = images.Select(i => new GalleryImageDto(i.Id, i.Src, i.Alt, i.Caption)).ToList();
        return new GalleryResponse(dtos, total, offset + limit < total);
    }

    /// <inheritdoc />
    public async Task<DestinationsResponse> GetFeaturedDestinationsAsync(int limit, int offset, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Mock featured destinations requested. Limit={Limit}, Offset={Offset}", limit, offset);
        var (items, total) = await GetPageWithCountAsync(_destinationRepository.GetPageAsync, _destinationRepository.GetCountAsync, limit, offset, cancellationToken);
        var dtos = items.Select(d => new DestinationDto(d.Id, d.Title, d.Description, d.Price, d.Rating, d.Image, d.Link)).ToList();
        return new DestinationsResponse(dtos, total, offset + limit < total);
    }

    /// <inheritdoc />
    public async Task<List<SimpleDestinationDto>> GetDestinationsAsync(bool featured, int limit, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Mock destinations requested. Featured={Featured}, Limit={Limit}", featured, limit);
        var items = await _simpleDestinationRepository.GetAsync(featured ? true : null, limit, cancellationToken);
        return items.Select(d => new SimpleDestinationDto(d.Id, d.Name, d.Type, d.Featured)).ToList();
    }

    /// <inheritdoc />
    public async Task<FaqResponse> GetFaqItemsAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Mock FAQ requested");
        var items = await _faqItemRepository.GetAllAsync(cancellationToken);
        var dtos = items.Select(f => new FaqItemDto(f.Id, f.Question, f.Answer)).ToList();
        return new FaqResponse(dtos);
    }

    /// <inheritdoc />
    public async Task<PackagesResponse> GetFeaturedPackagesAsync(int limit, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Mock featured packages requested. Limit={Limit}", limit);
        var items = await _travelPackageRepository.GetAsync(limit, cancellationToken);
        var dtos = items.Select(p => new TravelPackageDto(p.Id, p.Name, p.Description, p.Price, p.Duration, p.Image, p.Rating, p.Location)).ToList();
        return new PackagesResponse(dtos);
    }

    /// <inheritdoc />
    public async Task<PackagesResponse> GetPackagesAsync(int limit, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Mock packages requested. Limit={Limit}", limit);
        var items = await _travelPackageRepository.GetAsync(limit, cancellationToken);
        var dtos = items.Select(p => new TravelPackageDto(p.Id, p.Name, p.Description, p.Price, p.Duration, p.Image, p.Rating, p.Location)).ToList();
        return new PackagesResponse(dtos);
    }

    /// <summary>
    /// Runs getPage and getCount sequentially to avoid concurrent use of the same DbContext.
    /// </summary>
    private static async Task<(List<T> Items, int Total)> GetPageWithCountAsync<T>(
        Func<int, int, CancellationToken, Task<List<T>>> getPage,
        Func<CancellationToken, Task<int>> getCount,
        int limit,
        int offset,
        CancellationToken cancellationToken)
    {
        var items = await getPage(limit, offset, cancellationToken);
        var total = await getCount(cancellationToken);
        return (items, total);
    }
}
