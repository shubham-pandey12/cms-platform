using Mapster;
using Microsoft.Extensions.Logging;
using Cms.Application.DTOs.Widgets.Responses;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;

namespace Cms.Application.Services.Widgets;

/// <summary>
/// Service for widget operations.
/// </summary>
public sealed class WidgetService : IWidgetService
{
    private readonly IWidgetRepository _widgetRepository;
    private readonly ILogger<WidgetService> _logger;

    public WidgetService(IWidgetRepository widgetRepository, ILogger<WidgetService> logger)
    {
        _widgetRepository = widgetRepository;
        _logger = logger;
    }

    public async Task<List<WidgetDefinitionDto>> GetAllAsync(Guid? brandId, CancellationToken cancellationToken = default)
    {
        var widgets = await _widgetRepository.GetByBrandIdAsync(brandId, cancellationToken);
        return widgets.Select(w => w.Adapt<WidgetDefinitionDto>()).ToList();
    }

    public async Task<WidgetDefinitionDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var widget = await _widgetRepository.GetByIdAsync(id, cancellationToken);
        return widget is null ? null : widget.Adapt<WidgetDefinitionDto>();
    }

    public async Task<List<WidgetVersionListItemDto>> GetVersionsAsync(
        string slug,
        CancellationToken cancellationToken = default)
    {
        var versions = await _widgetRepository.GetVersionsBySlugAsync(slug, cancellationToken);
        return versions.Select(v => new WidgetVersionListItemDto(
            v.Id,
            v.Version,
            v.ChangeLog,
            v.IsLatest,
            v.IsDeprecated,
            v.CreatedAt)).ToList();
    }

    public async Task<WidgetVersionDto?> GetBySlugAndVersionAsync(
        string slug,
        string version,
        CancellationToken cancellationToken = default)
    {
        var v = await _widgetRepository.GetVersionAsync(slug, version, cancellationToken);
        if (v is null)
        {
            _logger.LogDebug("Widget version not found. Slug={Slug}, Version={Version}", slug, version);
            return null;
        }

        return MapToVersionDto(v);
    }

    public async Task<List<WidgetVersionDto>> GetAllVersionsAsync(
        string slug,
        CancellationToken cancellationToken = default)
    {
        var versions = await _widgetRepository.GetVersionsBySlugAsync(slug, cancellationToken);
        return versions.Select(MapToVersionDto).ToList();
    }

    private static WidgetVersionDto MapToVersionDto(Domain.Entities.WidgetDefinitionVersion v)
    {
        return new WidgetVersionDto(
            v.Id,
            v.Slug,
            v.Version,
            v.Name,
            v.Description,
            v.ConfigSchema,
            v.DefaultConfig,
            v.DefaultStyles?.Adapt<WidgetStylesDto>(),
            v.ChangeLog,
            v.IsLatest,
            v.IsDeprecated,
            v.CreatedAt);
    }
}

