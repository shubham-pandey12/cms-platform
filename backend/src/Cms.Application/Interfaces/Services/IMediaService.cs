using Cms.Application.DTOs.Media.Requests;
using Cms.Application.DTOs.Media.Responses;

namespace Cms.Application.Interfaces.Services;

/// <summary>
/// Service interface for media operations.
/// </summary>
public interface IMediaService
{
    Task<List<MediaItemDto>> GetAllAsync(Guid? brandId, CancellationToken cancellationToken = default);
    Task<MediaItemDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<MediaItemDto> UploadAsync(
        UploadMediaRequest request,
        Guid uploadedBy,
        string baseUrl,
        CancellationToken cancellationToken = default);
    Task<MediaItemDto> UpdateAsync(
        Guid id,
        UpdateMediaItemRequest request,
        Guid actorUserId,
        CancellationToken cancellationToken = default);
    Task DeleteAsync(
        Guid id,
        Guid actorUserId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Resolves file bytes for streaming when <see cref="Cms.Domain.Enums.MediaStorageProvider"/> supports it.
    /// </summary>
    Task<MediaFileResult> GetFileAsync(Guid id, CancellationToken cancellationToken = default);
}

