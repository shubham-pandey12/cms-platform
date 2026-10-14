namespace Cms.Application.DTOs.Templates.Responses;

public sealed record TemplateDto(
    Guid Id,
    string Name,
    string Description,
    Guid? BrandId,
    string BodyContent,
    string? Thumbnail,
    string? Category,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    Guid CreatedBy);

