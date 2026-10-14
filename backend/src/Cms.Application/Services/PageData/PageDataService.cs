using System.Text.Json;
using Microsoft.Extensions.Logging;
using Cms.Application.DTOs.PageData;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;

namespace Cms.Application.Services.PageData;

/// <summary>
/// Service for page data (variables and API calls) operations.
/// </summary>
public sealed class PageDataService : IPageDataService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IPageDataConfigRepository _pageDataConfigRepository;
    private readonly ILogger<PageDataService> _logger;

    public PageDataService(IPageDataConfigRepository pageDataConfigRepository, ILogger<PageDataService> logger)
    {
        _pageDataConfigRepository = pageDataConfigRepository;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<PageDataResponse> GetByPageIdAsync(Guid pageId, CancellationToken cancellationToken = default)
    {
        var config = await _pageDataConfigRepository.GetByPageIdAsync(pageId, cancellationToken);

        if (config is null)
        {
            _logger.LogDebug("No page data config for PageId={PageId}", pageId);
            return new PageDataResponse([], []);
        }

        var variables = DeserializeList<PageVariableDto>(config.Variables);
        var apiCalls = DeserializeList<ApiCallDto>(config.ApiCalls);
        return new PageDataResponse(variables, apiCalls);
    }

    private static IReadOnlyList<T> DeserializeList<T>(string json)
    {
        try
        {
            var items = JsonSerializer.Deserialize<List<T>>(json, JsonOptions);
            return items ?? new List<T>();
        }
        catch
        {
            return new List<T>();
        }
    }
}
