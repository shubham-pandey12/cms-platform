using System.Text.Json;
using Microsoft.Extensions.Logging;
using Cms.Application.DTOs.SiteSettings;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Entities;

namespace Cms.Application.Services.SiteSettings;

/// <summary>
/// Service for site settings operations.
/// </summary>
public sealed class SiteSettingsService : ISiteSettingsService
{
    private readonly ISiteSettingsRepository _siteSettingsRepository;
    private readonly IBrandRepository _brandRepository;
    private readonly ILogger<SiteSettingsService> _logger;

    public SiteSettingsService(
        ISiteSettingsRepository siteSettingsRepository,
        IBrandRepository brandRepository,
        ILogger<SiteSettingsService> logger)
    {
        _siteSettingsRepository = siteSettingsRepository;
        _brandRepository = brandRepository;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<SiteSettingsDto?> GetByBrandIdOrSlugAsync(string brandIdOrSlug, CancellationToken cancellationToken = default)
    {
        Guid? resolvedBrandId = null;

        if (Guid.TryParse(brandIdOrSlug, out var parsedId))
        {
            resolvedBrandId = parsedId;
        }
        else
        {
            var normalizedSlug = brandIdOrSlug.Trim().ToLowerInvariant();
            var brand = await _brandRepository.GetBySubdomainAsync(normalizedSlug, cancellationToken);
            resolvedBrandId = brand?.Id;
        }

        if (resolvedBrandId is null)
        {
            _logger.LogDebug("Site settings lookup: brand not resolved for {BrandIdOrSlug}", brandIdOrSlug);
            return null;
        }

        var settings = await _siteSettingsRepository.GetByBrandIdAsync(resolvedBrandId.Value, cancellationToken);
        return settings is null ? null : MapToDto(settings);
    }

    /// <inheritdoc />
    public async Task<SiteSettingsDto?> UpdateAsync(Guid id, UpdateSiteSettingsRequest request, CancellationToken cancellationToken = default)
    {
        var settings = await _siteSettingsRepository.GetByIdAsync(id, cancellationToken);
        if (settings is null)
        {
            return null;
        }

        if (request.SiteName is not null) settings.SiteName = request.SiteName;
        if (request.SiteDescription is not null) settings.SiteDescription = request.SiteDescription;
        if (request.Favicon is not null) settings.Favicon = request.Favicon;
        if (request.OgImage is not null) settings.OgImage = request.OgImage;
        if (request.ShowNavigation.HasValue) settings.ShowNavigation = request.ShowNavigation.Value;
        if (request.NavigationPosition is not null) settings.NavigationPosition = request.NavigationPosition;
        if (request.NavigationStyle is not null) settings.NavigationStyle = request.NavigationStyle;
        if (request.ShowLogo.HasValue) settings.ShowLogo = request.ShowLogo.Value;
        if (request.LogoUrl is not null) settings.LogoUrl = request.LogoUrl;
        if (request.EnableSearch.HasValue) settings.EnableSearch = request.EnableSearch.Value;
        if (request.GoogleAnalyticsId is not null) settings.GoogleAnalyticsId = request.GoogleAnalyticsId;
        if (request.CustomHeadCode is not null) settings.CustomHeadCode = request.CustomHeadCode;
        if (request.EnableSocialSharing.HasValue) settings.EnableSocialSharing = request.EnableSocialSharing.Value;
        if (request.TwitterHandle is not null) settings.TwitterHandle = request.TwitterHandle;
        if (request.CustomDomain is not null) settings.CustomDomain = request.CustomDomain;
        if (request.RobotsTxt is not null) settings.RobotsTxt = request.RobotsTxt;
        if (request.CanonicalUrl is not null) settings.CanonicalUrl = request.CanonicalUrl;
        if (request.GlobalCss is not null) settings.GlobalCss = request.GlobalCss;
        if (request.HeadScripts is not null) settings.HeadScripts = request.HeadScripts;
        if (request.BodyScripts is not null) settings.BodyScripts = request.BodyScripts;
        if (request.SupportedLangs is not null)
        {
            settings.SupportedLangsJson = request.SupportedLangs.Length == 0
                ? null
                : JsonSerializer.Serialize(request.SupportedLangs);
        }

        settings.UpdatedAt = DateTime.UtcNow;

        await _siteSettingsRepository.UpdateAsync(settings, cancellationToken);
        await _siteSettingsRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Site settings updated. SettingsId={SettingsId}, BrandId={BrandId}",
            settings.Id,
            settings.BrandId);

        return MapToDto(settings);
    }

    private SiteSettingsDto MapToDto(Cms.Domain.Entities.SiteSettings s)
    {
        string[]? supportedLangs = null;
        if (!string.IsNullOrWhiteSpace(s.SupportedLangsJson))
        {
            try
            {
                supportedLangs = JsonSerializer.Deserialize<string[]>(s.SupportedLangsJson);
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex,
                    "Invalid SupportedLangsJson for site settings {SettingsId} (BrandId: {BrandId}); treating as null",
                    s.Id, s.BrandId);
            }
        }

        return new SiteSettingsDto(s.Id, s.BrandId, s.SiteName, s.SiteDescription, s.Favicon, s.OgImage, s.ShowNavigation,
            s.NavigationPosition, s.NavigationStyle, s.ShowLogo, s.LogoUrl, s.EnableSearch, s.GoogleAnalyticsId,
            s.CustomHeadCode, s.EnableSocialSharing, s.TwitterHandle, s.CustomDomain, s.RobotsTxt, s.CanonicalUrl,
            s.GlobalCss, s.HeadScripts, s.BodyScripts, supportedLangs, s.UpdatedAt);
    }
}
