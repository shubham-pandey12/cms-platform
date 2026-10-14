using Cms.Domain.Enums;

namespace Cms.Application.DTOs.Media.Responses;

public sealed record MediaItemDto(
    Guid Id,
    string Name,
    string Url,
    string Thumbnail,
    MediaType Type,
    long Size,
    Guid BrandId,
    string Folder,
    string? Alt,
    Guid UploadedBy,
    DateTime UploadedAt,
    MediaStorageProvider StorageProvider);

