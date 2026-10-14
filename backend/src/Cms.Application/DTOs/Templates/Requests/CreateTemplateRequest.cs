namespace Cms.Application.DTOs.Templates.Requests;

public sealed record CreateTemplateRequest(
    string Name,
    string Description,
    Guid? BrandId,
    string BodyContent,
    string? Thumbnail,
    string? Category);

