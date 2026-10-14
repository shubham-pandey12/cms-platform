using Cms.Application.DTOs.Widgets.Responses;

namespace Cms.Application.Interfaces.Services;

/// <summary>
/// Service interface for widget operations.
/// </summary>
public interface IWidgetService
{
    Task<List<WidgetDefinitionDto>> GetAllAsync(Guid? brandId, CancellationToken cancellationToken = default);
    Task<WidgetDefinitionDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all versions available for a specific widget.
    /// </summary>
    Task<List<WidgetVersionListItemDto>> GetVersionsAsync(string slug, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a specific version of a widget by slug and version string.
    /// </summary>
    Task<WidgetVersionDto?> GetBySlugAndVersionAsync(string slug, string version, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all versions with full details for a specific widget.
    /// </summary>
    Task<List<WidgetVersionDto>> GetAllVersionsAsync(string slug, CancellationToken cancellationToken = default);
}

