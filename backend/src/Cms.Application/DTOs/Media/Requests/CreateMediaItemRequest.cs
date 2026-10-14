using Cms.Domain.Enums;

namespace Cms.Application.DTOs.Media.Requests;

public sealed record CreateMediaItemRequest(
    string Name,
    string Url,
    string Thumbnail,
    MediaType Type,
    long Size,
    Guid BrandId,
    string Folder,
    string? Alt);

