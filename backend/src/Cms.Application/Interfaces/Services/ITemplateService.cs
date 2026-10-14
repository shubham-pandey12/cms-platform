using Cms.Application.DTOs.Templates.Requests;
using Cms.Application.DTOs.Templates.Responses;

namespace Cms.Application.Interfaces.Services;

/// <summary>
/// Service interface for template operations.
/// </summary>
public interface ITemplateService
{
    Task<List<TemplateDto>> GetAllAsync(Guid? brandId, CancellationToken cancellationToken = default);
    Task<TemplateDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TemplateDto> CreateAsync(CreateTemplateRequest request, Guid createdBy, CancellationToken cancellationToken = default);
    Task<TemplateDto?> UpdateAsync(Guid id, UpdateTemplateRequest request, CancellationToken cancellationToken = default);
}
