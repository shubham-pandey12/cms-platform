using Mapster;
using Microsoft.Extensions.Logging;
using Cms.Application.DTOs.SiteLayouts.Requests;
using Cms.Application.DTOs.SiteLayouts.Responses;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Entities;

namespace Cms.Application.Services.SiteLayouts;

/// <summary>
/// Service for site layout operations.
/// </summary>
public sealed class SiteLayoutService : ISiteLayoutService
{
    private readonly ISiteLayoutRepository _siteLayoutRepository;
    private readonly ILogger<SiteLayoutService> _logger;

    public SiteLayoutService(ISiteLayoutRepository siteLayoutRepository, ILogger<SiteLayoutService> logger)
    {
        _siteLayoutRepository = siteLayoutRepository;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<List<SiteLayoutDto>> GetAllAsync(Guid? brandId, CancellationToken cancellationToken = default)
    {
        var layouts = await _siteLayoutRepository.GetAllByBrandIdAsync(brandId, cancellationToken);
        return layouts.Select(l => l.Adapt<SiteLayoutDto>()).ToList();
    }

    /// <inheritdoc />
    public async Task<SiteLayoutDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var layout = await _siteLayoutRepository.GetByIdAsync(id, cancellationToken);
        return layout is null ? null : layout.Adapt<SiteLayoutDto>();
    }

    /// <inheritdoc />
    public async Task<SiteLayoutDto> CreateAsync(CreateSiteLayoutRequest request, Guid createdBy, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var layout = new SiteLayout
        {
            BrandId = request.BrandId,
            Name = request.Name,
            IsDefault = request.IsDefault,
            Header = request.Header,
            Footer = request.Footer,
            Sidebar = request.Sidebar,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedBy = createdBy,
            UpdatedBy = createdBy
        };

        await _siteLayoutRepository.AddAsync(layout, cancellationToken);

        if (request.IsDefault)
        {
            await ClearDefaultForBrandExceptAsync(layout.BrandId, layout.Id, cancellationToken);
        }

        await _siteLayoutRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Site layout created. LayoutId={LayoutId}, BrandId={BrandId}, UserId={UserId}",
            layout.Id,
            layout.BrandId,
            createdBy);

        return layout.Adapt<SiteLayoutDto>();
    }

    /// <inheritdoc />
    public async Task<SiteLayoutDto?> UpdateAsync(Guid id, UpdateSiteLayoutRequest request, Guid updatedBy, CancellationToken cancellationToken = default)
    {
        var layout = await _siteLayoutRepository.GetByIdAsync(id, cancellationToken);
        if (layout is null)
        {
            return null;
        }

        if (request.Name is not null) layout.Name = request.Name;
        if (request.IsDefault.HasValue) layout.IsDefault = request.IsDefault.Value;
        if (request.Header is not null) layout.Header = request.Header;
        if (request.Footer is not null) layout.Footer = request.Footer;
        if (request.Sidebar is not null) layout.Sidebar = request.Sidebar;
        layout.UpdatedAt = DateTime.UtcNow;
        layout.UpdatedBy = updatedBy;

        if (layout.IsDefault)
        {
            await ClearDefaultForBrandExceptAsync(layout.BrandId, id, cancellationToken);
        }

        await _siteLayoutRepository.UpdateAsync(layout, cancellationToken);
        await _siteLayoutRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Site layout updated. LayoutId={LayoutId}, BrandId={BrandId}, UserId={UserId}",
            layout.Id,
            layout.BrandId,
            updatedBy);

        return layout.Adapt<SiteLayoutDto>();
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var layout = await _siteLayoutRepository.GetByIdAsync(id, cancellationToken);
        if (layout is null)
        {
            return false;
        }

        await _siteLayoutRepository.DeleteByIdAsync(id, cancellationToken);
        await _siteLayoutRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Site layout deleted. LayoutId={LayoutId}, BrandId={BrandId}",
            id,
            layout.BrandId);

        return true;
    }

    private async Task ClearDefaultForBrandExceptAsync(Guid brandId, Guid exceptLayoutId, CancellationToken cancellationToken)
    {
        var others = await _siteLayoutRepository.GetTrackedByBrandIdAsync(brandId, cancellationToken);
        foreach (var other in others)
        {
            if (other.Id != exceptLayoutId && other.IsDefault)
            {
                other.IsDefault = false;
                await _siteLayoutRepository.UpdateAsync(other, cancellationToken);
            }
        }
    }
}
