using Mapster;
using Microsoft.Extensions.Logging;
using Cms.Application.DTOs.Templates.Requests;
using Cms.Application.DTOs.Templates.Responses;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Entities;

namespace Cms.Application.Services.Templates;

/// <summary>
/// Service for template operations.
/// </summary>
public sealed class TemplateService : ITemplateService
{
    private readonly ITemplateRepository _templateRepository;
    private readonly ILogger<TemplateService> _logger;

    public TemplateService(ITemplateRepository templateRepository, ILogger<TemplateService> logger)
    {
        _templateRepository = templateRepository;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<List<TemplateDto>> GetAllAsync(Guid? brandId, CancellationToken cancellationToken = default)
    {
        var templates = await _templateRepository.GetAllAsync(brandId, cancellationToken);
        return templates.Select(t => t.Adapt<TemplateDto>()).ToList();
    }

    /// <inheritdoc />
    public async Task<TemplateDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var template = await _templateRepository.GetByIdAsync(id, cancellationToken);
        return template is null ? null : template.Adapt<TemplateDto>();
    }

    /// <inheritdoc />
    public async Task<TemplateDto> CreateAsync(CreateTemplateRequest request, Guid createdBy, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var template = new Template
        {
            Name = request.Name,
            Description = request.Description,
            BrandId = request.BrandId,
            BodyContent = request.BodyContent,
            Thumbnail = request.Thumbnail,
            Category = request.Category,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedBy = createdBy
        };

        await _templateRepository.AddAsync(template, cancellationToken);
        await _templateRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Template created. TemplateId={TemplateId}, BrandId={BrandId}, UserId={UserId}",
            template.Id,
            template.BrandId,
            createdBy);

        return template.Adapt<TemplateDto>();
    }

    /// <inheritdoc />
    public async Task<TemplateDto?> UpdateAsync(Guid id, UpdateTemplateRequest request, CancellationToken cancellationToken = default)
    {
        var template = await _templateRepository.GetByIdAsync(id, cancellationToken);
        if (template is null)
        {
            return null;
        }

        if (request.Name is not null) template.Name = request.Name;
        if (request.Description is not null) template.Description = request.Description;
        if (request.BodyContent is not null) template.BodyContent = request.BodyContent;
        if (request.Thumbnail is not null) template.Thumbnail = request.Thumbnail;
        if (request.Category is not null) template.Category = request.Category;

        template.UpdatedAt = DateTime.UtcNow;

        await _templateRepository.UpdateAsync(template, cancellationToken);
        await _templateRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Template updated. TemplateId={TemplateId}, BrandId={BrandId}",
            template.Id,
            template.BrandId);

        return template.Adapt<TemplateDto>();
    }
}
