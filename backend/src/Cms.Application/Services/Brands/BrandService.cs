using System.Text.Json;
using Mapster;
using Microsoft.Extensions.Logging;
using Cms.Application.DTOs.Brands.Requests;
using Cms.Application.DTOs.Brands.Responses;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Entities;
using Cms.Domain.ValueObjects;

namespace Cms.Application.Services.Brands;

/// <summary>
/// Service for brand operations.
/// </summary>
public sealed class BrandService : IBrandService
{
    private static readonly Guid NavbarWidgetId = new("50000000-0000-0000-0000-000000000002");
    private static readonly Guid FooterWidgetId = new("50000000-0000-0000-0000-000000000007");

    private readonly IBrandRepository _brandRepository;
    private readonly IBrandDomainRepository _brandDomainRepository;
    private readonly ISiteLayoutRepository _siteLayoutRepository;
    private readonly IThemeRepository _themeRepository;
    private readonly ISiteSettingsRepository _siteSettingsRepository;
    private readonly ILogger<BrandService> _logger;

    public BrandService(
        IBrandRepository brandRepository,
        IBrandDomainRepository brandDomainRepository,
        ISiteLayoutRepository siteLayoutRepository,
        IThemeRepository themeRepository,
        ISiteSettingsRepository siteSettingsRepository,
        ILogger<BrandService> logger)
    {
        _brandRepository = brandRepository;
        _brandDomainRepository = brandDomainRepository;
        _siteLayoutRepository = siteLayoutRepository;
        _themeRepository = themeRepository;
        _siteSettingsRepository = siteSettingsRepository;
        _logger = logger;
    }

    public async Task<List<BrandDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var brands = await _brandRepository.GetAllAsync(cancellationToken);
        return brands.Select(b => b.Adapt<BrandDto>()).ToList();
    }

    public async Task<BrandDto?> GetByIdOrSlugAsync(string idOrSlug, CancellationToken cancellationToken = default)
    {
        Brand? brand = null;

        // Try GUID lookup first
        if (Guid.TryParse(idOrSlug, out var brandId))
        {
            brand = await _brandRepository.GetByIdAsync(brandId, cancellationToken);
        }

        // Fallback to subdomain/slug lookup
        if (brand is null)
        {
            brand = await _brandRepository.GetBySubdomainAsync(idOrSlug, cancellationToken);
        }

        return brand is null ? null : brand.Adapt<BrandDto>();
    }

    public async Task<BrandDto?> GetByHostAsync(string host, CancellationToken cancellationToken = default)
    {
        var brand = await _brandRepository.GetByHostAsync(host, cancellationToken);
        return brand is null ? null : brand.Adapt<BrandDto>();
    }

    public async Task<BrandAvailabilityResponse> CheckAvailabilityAsync(string? domain, string? subdomain, Guid? excludeBrandId, CancellationToken cancellationToken = default)
    {
        var domainAvailable = true;
        var subdomainAvailable = true;

        if (!string.IsNullOrWhiteSpace(domain))
        {
            var existingByDomain = await _brandRepository.GetByDomainAsync(domain.Trim(), cancellationToken);
            domainAvailable = existingByDomain is null || (excludeBrandId.HasValue && existingByDomain.Id == excludeBrandId.Value);
        }

        if (!string.IsNullOrWhiteSpace(subdomain))
        {
            var existingBySubdomain = await _brandRepository.GetBySubdomainAsync(subdomain.Trim(), cancellationToken);
            subdomainAvailable = existingBySubdomain is null || (excludeBrandId.HasValue && existingBySubdomain.Id == excludeBrandId.Value);
        }

        return new BrandAvailabilityResponse(domainAvailable, subdomainAvailable);
    }

    public async Task<BrandDto> CreateAsync(CreateBrandRequest request, Guid? createdByUserId = null, CancellationToken cancellationToken = default)
    {
        var createdBy = createdByUserId ?? Guid.Empty;
        var brand = new Brand
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Domain = request.Domain,
            Subdomain = request.Subdomain,
            Logo = request.Logo,
            PrimaryColor = request.PrimaryColor,
            SecondaryColor = request.SecondaryColor,
            GlobalCss = request.GlobalCss,
            CustomFontUrls = request.CustomFontUrls ?? [],
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _brandRepository.AddAsync(brand, cancellationToken);

        var headerJson = JsonSerializer.Serialize(new[]
        {
            new
            {
                id = "header-nav-1",
                widgetDefinitionId = NavbarWidgetId.ToString(),
                config = new
                {
                    logoText = request.Name,
                    sticky = true,
                    menuItems = new[]
                    {
                        new { id = "m1", label = "Home", url = "/", target = "_self" },
                        new { id = "m2", label = "About", url = "/about", target = "_self" },
                        new { id = "m3", label = "Contact", url = "/contact", target = "_self" }
                    }
                },
                order = 0,
                isVisible = true
            }
        });

        var footerJson = JsonSerializer.Serialize(new[]
        {
            new
            {
                id = "footer-1",
                widgetDefinitionId = FooterWidgetId.ToString(),
                config = new
                {
                    brandName = request.Name,
                    copyrightText = "© " + DateTime.UtcNow.Year + " " + request.Name + ". All rights reserved."
                },
                order = 0,
                isVisible = true
            }
        });

        var defaultLayout = new SiteLayout
        {
            BrandId = brand.Id,
            Name = "Default Layout",
            IsDefault = true,
            Header = headerJson,
            Footer = footerJson,
            Sidebar = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
            UpdatedBy = createdBy
        };

        await _siteLayoutRepository.AddAsync(defaultLayout, cancellationToken);

        // Handle theme: use selected theme or create default
        Theme brandTheme;
        if (request.ThemeId.HasValue)
        {
            var selectedTheme = await _themeRepository.GetByIdAsync(request.ThemeId.Value, cancellationToken);
            if (selectedTheme is not null)
            {
                // Copy the selected theme for this brand
                brandTheme = new Theme
                {
                    Id = Guid.NewGuid(),
                    Name = selectedTheme.Name,
                    BrandId = brand.Id,
                    IsDefault = true,
                    Colors = new ThemeColors
                    {
                        Primary = selectedTheme.Colors.Primary,
                        Secondary = selectedTheme.Colors.Secondary,
                        Background = selectedTheme.Colors.Background,
                        Text = selectedTheme.Colors.Text,
                        Accent = selectedTheme.Colors.Accent
                    },
                    Fonts = new ThemeFonts
                    {
                        Heading = selectedTheme.Fonts.Heading,
                        Body = selectedTheme.Fonts.Body
                    },
                    HeadingFontConfig = selectedTheme.HeadingFontConfig,
                    BodyFontConfig = selectedTheme.BodyFontConfig
                };
            }
            else
            {
                // Fallback to default if theme not found
                brandTheme = CreateDefaultTheme(brand.Id, request.PrimaryColor, request.SecondaryColor);
            }
        }
        else
        {
            // Create default theme
            brandTheme = CreateDefaultTheme(brand.Id, request.PrimaryColor, request.SecondaryColor);
        }

        await _themeRepository.AddAsync(brandTheme, cancellationToken);

        // Create site settings
        var siteSettings = new Cms.Domain.Entities.SiteSettings
        {
            Id = Guid.NewGuid(),
            BrandId = brand.Id,
            SiteName = request.SiteName ?? request.Name,
            SiteDescription = request.SiteDescription ?? $"Website for {request.Name}",
            Favicon = request.Favicon ?? request.Logo ?? string.Empty,
            OgImage = string.Empty,
            ShowNavigation = request.ShowNavigation ?? true,
            NavigationPosition = request.NavigationPosition ?? "top",
            NavigationStyle = request.NavigationStyle ?? "standard",
            ShowLogo = request.ShowLogo ?? true,
            LogoUrl = request.LogoUrl ?? request.Logo ?? string.Empty,
            EnableSearch = request.EnableSearch ?? true,
            GoogleAnalyticsId = string.Empty,
            CustomHeadCode = string.Empty,
            EnableSocialSharing = true,
            TwitterHandle = string.Empty,
            CustomDomain = request.CustomDomain ?? request.Domain,
            RobotsTxt = "User-agent: *\nAllow: /",
            CanonicalUrl = $"https://{request.CustomDomain ?? request.Domain}",
            GlobalCss = request.GlobalCss,
            UpdatedAt = DateTime.UtcNow
        };

        await _siteSettingsRepository.AddAsync(siteSettings, cancellationToken);
        await _brandRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Brand created. BrandId={BrandId}, Subdomain={Subdomain}, UserId={UserId}",
            brand.Id,
            brand.Subdomain,
            createdBy);

        return brand.Adapt<BrandDto>();
    }

    public async Task<BrandDto> UpdateAsync(Guid id, UpdateBrandRequest request, CancellationToken cancellationToken = default)
    {
        var brand = await _brandRepository.GetByIdAsync(id, cancellationToken);
        if (brand is null)
        {
            throw new KeyNotFoundException($"Brand with id {id} not found");
        }

        if (request.Name is not null) brand.Name = request.Name;
        if (request.Domain is not null) brand.Domain = request.Domain;
        if (request.Subdomain is not null) brand.Subdomain = request.Subdomain;
        if (request.Logo is not null) brand.Logo = request.Logo;
        if (request.PrimaryColor is not null) brand.PrimaryColor = request.PrimaryColor;
        if (request.SecondaryColor is not null) brand.SecondaryColor = request.SecondaryColor;
        if (request.GlobalCss is not null) brand.GlobalCss = request.GlobalCss;
        if (request.CustomFontUrls is not null) brand.CustomFontUrls = request.CustomFontUrls;
        brand.UpdatedAt = DateTime.UtcNow;

        await _brandRepository.UpdateAsync(brand, cancellationToken);
        await _brandRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Brand updated. BrandId={BrandId}", id);

        return brand.Adapt<BrandDto>();
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var brand = await _brandRepository.GetByIdAsync(id, cancellationToken);
        if (brand is null)
        {
            throw new KeyNotFoundException($"Brand with id {id} not found");
        }

        await _brandRepository.DeleteAsync(brand, cancellationToken);
        await _brandRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Brand deleted. BrandId={BrandId}", id);
    }

    public async Task<List<string>> GetDomainsAsync(Guid brandId, CancellationToken cancellationToken = default)
    {
        _ = await _brandRepository.GetByIdAsync(brandId, cancellationToken)
            ?? throw new KeyNotFoundException($"Brand with id {brandId} not found.");
        var list = await _brandDomainRepository.GetByBrandIdAsync(brandId, cancellationToken);
        return list.Select(bd => bd.Domain).ToList();
    }

    public async Task AddDomainAsync(Guid brandId, string domain, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(domain);
        var normalized = domain.Trim().ToLowerInvariant();
        if (normalized.Length > 500)
            throw new ArgumentException("Domain must be at most 500 characters.", nameof(domain));
        if (normalized.Contains(' ') || normalized.Contains('/'))
            throw new ArgumentException("Domain must not contain spaces or slashes.", nameof(domain));

        var brand = await _brandRepository.GetByIdAsync(brandId, cancellationToken)
            ?? throw new KeyNotFoundException($"Brand with id {brandId} not found.");

        var existingByBrandDomain = await _brandRepository.GetByDomainAsync(normalized, cancellationToken);
        if (existingByBrandDomain is not null && existingByBrandDomain.Id != brandId)
            throw new InvalidOperationException($"Domain '{normalized}' is already used by another brand.");

        var existingInTable = await _brandDomainRepository.GetByDomainAsync(normalized, cancellationToken);
        if (existingInTable is not null && existingInTable.BrandId != brandId)
            throw new InvalidOperationException($"Domain '{normalized}' is already used by another brand.");

        if (string.Equals(brand.Domain, normalized, StringComparison.OrdinalIgnoreCase))
            return;
        if (existingInTable is not null)
            return;

        var brandDomain = new BrandDomain { BrandId = brandId, Domain = normalized };
        await _brandDomainRepository.AddAsync(brandDomain, cancellationToken);
        await _brandRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Brand domain added. BrandId={BrandId}, Domain={Domain}",
            brandId,
            normalized);
    }

    public async Task RemoveDomainAsync(Guid brandId, string domain, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(domain);
        var normalized = domain.Trim().ToLowerInvariant();

        var brand = await _brandRepository.GetByIdAsync(brandId, cancellationToken)
            ?? throw new KeyNotFoundException($"Brand with id {brandId} not found.");

        var domains = await _brandDomainRepository.GetByBrandIdAsync(brandId, cancellationToken);
        var toRemove = domains.FirstOrDefault(bd => string.Equals(bd.Domain, normalized, StringComparison.OrdinalIgnoreCase));
        if (toRemove is null)
            return;

        var remainingWays = (string.IsNullOrEmpty(brand.Domain) ? 0 : 1) + (domains.Count - 1);
        if (remainingWays < 1)
            throw new InvalidOperationException("A brand must have at least one domain. Add another domain before removing this one.");

        await _brandDomainRepository.DeleteAsync(toRemove, cancellationToken);
        await _brandRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Brand domain removed. BrandId={BrandId}, Domain={Domain}",
            brandId,
            normalized);
    }

    private static Theme CreateDefaultTheme(Guid brandId, string primaryColor, string secondaryColor) => new()
    {
        Id = Guid.NewGuid(),
        Name = "Default Theme",
        BrandId = brandId,
        IsDefault = true,
        Colors = new ThemeColors
        {
            Primary = primaryColor,
            Secondary = secondaryColor,
            Background = "#ffffff",
            Text = "#1e293b",
            Accent = primaryColor
        },
        Fonts = new ThemeFonts { Heading = "Inter", Body = "Inter" }
    };
}

