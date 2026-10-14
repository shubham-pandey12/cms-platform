using Cms.Application.DTOs.SiteSettings;

namespace Cms.Application.Interfaces.Services;

/// <summary>
/// Service interface for site settings operations.
/// </summary>
public interface ISiteSettingsService
{
    Task<SiteSettingsDto?> GetByBrandIdOrSlugAsync(string brandIdOrSlug, CancellationToken cancellationToken = default);
    Task<SiteSettingsDto?> UpdateAsync(Guid id, UpdateSiteSettingsRequest request, CancellationToken cancellationToken = default);
}
