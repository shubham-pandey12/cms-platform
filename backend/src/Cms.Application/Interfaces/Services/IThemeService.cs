using Cms.Application.DTOs.Themes.Requests;
using Cms.Application.DTOs.Themes.Responses;

namespace Cms.Application.Interfaces.Services;

/// <summary>
/// Service interface for theme operations.
/// </summary>
public interface IThemeService
{
    Task<List<ThemeDto>> GetAllAsync(Guid? brandId, CancellationToken cancellationToken = default);
    Task<ThemeDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ThemeDto> CreateAsync(CreateThemeRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
