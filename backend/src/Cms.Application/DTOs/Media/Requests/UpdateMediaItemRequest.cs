namespace Cms.Application.DTOs.Media.Requests;

public sealed record UpdateMediaItemRequest(
    string? Name,
    string? Alt,
    string? Folder);

