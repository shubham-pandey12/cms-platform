namespace Cms.Application.DTOs.Templates.Requests;

public sealed record UpdateTemplateRequest(
    string? Name,
    string? Description,
    string? BodyContent,
    string? Thumbnail,
    string? Category);

