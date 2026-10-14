using Cms.Application.DTOs.SiteLayouts.Requests;
using Cms.Application.DTOs.SiteLayouts.Responses;

namespace Cms.Application.Interfaces.Services;

/// <summary>
/// Service interface for site layout operations.
/// </summary>
public interface ISiteLayoutService
{
    Task<List<SiteLayoutDto>> GetAllAsync(Guid? brandId, CancellationToken cancellationToken = default);
    Task<SiteLayoutDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<SiteLayoutDto> CreateAsync(CreateSiteLayoutRequest request, Guid createdBy, CancellationToken cancellationToken = default);
    Task<SiteLayoutDto?> UpdateAsync(Guid id, UpdateSiteLayoutRequest request, Guid updatedBy, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
