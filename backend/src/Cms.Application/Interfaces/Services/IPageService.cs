using Cms.Application.DTOs.Pages.Requests;
using Cms.Application.DTOs.Pages.Responses;

namespace Cms.Application.Interfaces.Services;

/// <summary>
/// Service interface for page operations.
/// </summary>
public interface IPageService
{
    Task<List<PageDto>> GetAllAsync(Guid? brandId, CancellationToken cancellationToken = default);
    Task<PageDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PageDto?> GetByUriAsync(string brandIdOrSlug, string uri, CancellationToken cancellationToken = default);
    Task<List<PageRevisionDto>> GetRevisionsAsync(Guid pageId, CancellationToken cancellationToken = default);
    Task<PageRevisionDetailDto?> GetRevisionByIdAsync(Guid pageId, Guid revisionId, CancellationToken cancellationToken = default);
    Task<PageDto> CreateAsync(CreatePageRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<PageDto> UpdateAsync(Guid id, UpdatePageRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<PageDto> PublishAsync(Guid id, PublishPageRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Builds sitemap XML for published static indexable pages. <paramref name="absoluteBaseUrl"/> must be an absolute URL with no trailing slash (except scheme-only edge cases handled internally).
    /// </summary>
    Task<string> GetSitemapXmlAsync(Guid brandId, string absoluteBaseUrl, CancellationToken cancellationToken = default);
}

