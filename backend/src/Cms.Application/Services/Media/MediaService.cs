using Mapster;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Cms.Application.DTOs.Media.Requests;
using Cms.Application.DTOs.Media.Responses;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;
using Cms.Application.Options;
using Cms.Domain.Entities;
using Cms.Domain.Enums;

namespace Cms.Application.Services.Media;

/// <summary>
/// Service for media operations.
/// </summary>
public sealed class MediaService : IMediaService
{
    private readonly IMediaRepository _mediaRepository;
    private readonly IBrandRepository _brandRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IOptions<MediaOptions> _mediaOptions;
    private readonly ILogger<MediaService> _logger;

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    private static readonly HashSet<string> AllowedUploadContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
        "image/gif",
        "image/svg+xml",
        "application/pdf",
        "text/plain",
        "text/markdown",
        "text/x-markdown",
        "text/csv",
        "application/json",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };

    /// <summary>
    /// When Content-Type is missing or generic, infer from extension (must match an allowed upload).
    /// </summary>
    private static readonly Dictionary<string, string> ExtensionToContentType = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp",
        [".avif"] = "image/avif",
        [".gif"] = "image/gif",
        [".svg"] = "image/svg+xml",
        [".pdf"] = "application/pdf",
        [".txt"] = "text/plain",
        [".md"] = "text/markdown",
        [".csv"] = "text/csv",
        [".json"] = "application/json",
        [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        [".pptx"] = "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };

    public MediaService(
        IMediaRepository mediaRepository,
        IBrandRepository brandRepository,
        UserManager<ApplicationUser> userManager,
        IOptions<MediaOptions> mediaOptions,
        ILogger<MediaService> logger)
    {
        _mediaRepository = mediaRepository;
        _brandRepository = brandRepository;
        _userManager = userManager;
        _mediaOptions = mediaOptions;
        _logger = logger;
    }

    public async Task<List<MediaItemDto>> GetAllAsync(Guid? brandId, CancellationToken cancellationToken = default)
    {
        var mediaItems = brandId.HasValue
            ? await _mediaRepository.GetByBrandIdAsync(brandId.Value, cancellationToken)
            : await _mediaRepository.GetAllSummaryAsync(cancellationToken);

        return mediaItems.Select(m => m.Adapt<MediaItemDto>()).ToList();
    }

    public async Task<MediaItemDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var mediaItem = await _mediaRepository.GetSummaryByIdAsync(id, cancellationToken);
        return mediaItem is null ? null : mediaItem.Adapt<MediaItemDto>();
    }

    public async Task<MediaFileResult> GetFileAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var mediaItem = await _mediaRepository.GetByIdWithContentAsync(id, cancellationToken);
        if (mediaItem is null)
        {
            return new MediaFileResult.NotFound();
        }

        return mediaItem.StorageProvider switch
        {
            MediaStorageProvider.Database when mediaItem.Content is { Length: > 0 } =>
                new MediaFileResult.Found(
                    mediaItem.Content,
                    string.IsNullOrWhiteSpace(mediaItem.ContentType)
                        ? "application/octet-stream"
                        : mediaItem.ContentType!),
            MediaStorageProvider.Database => new MediaFileResult.NotFound(),
            MediaStorageProvider.External => new MediaFileResult.ExternalNotStreamed(),
            MediaStorageProvider.Blob => new MediaFileResult.BlobNotImplemented(),
            _ => new MediaFileResult.NotFound(),
        };
    }

    public async Task<MediaItemDto> UploadAsync(
        UploadMediaRequest request,
        Guid uploadedBy,
        string baseUrl,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request.File, nameof(request.File));

        if (request.File.Length == 0)
        {
            throw new InvalidOperationException("Uploaded file is empty.");
        }

        if (request.File.Length > MaxFileSizeBytes)
        {
            throw new InvalidOperationException("File exceeds the maximum allowed size of 10 MB.");
        }

        await EnsureBrandAccessAsync(uploadedBy, request.BrandId, cancellationToken);

        var contentType = ResolveUploadContentType(request.File);

        var extension = Path.GetExtension(request.File.FileName);
        if (string.IsNullOrWhiteSpace(extension))
        {
            extension = ".bin";
        }

        await using var readStream = request.File.OpenReadStream();
        await using var buffer = new MemoryStream();
        await readStream.CopyToAsync(buffer, cancellationToken);
        var bytes = buffer.ToArray();

        var encoding = MediaUploadEncoding.None;
        if (IsRasterWebpCandidate(contentType))
        {
            encoding = MediaImageConverter.ParseOutputFormat(request.OutputFormat, contentType);
        }

        var displayName = Path.GetFileName(request.File.FileName);
        if (encoding == MediaUploadEncoding.Webp)
        {
            var q = Math.Clamp(_mediaOptions.Value.WebpQuality, 1, 100);
            _logger.LogDebug(
                "Converting upload to WebP. Quality={Quality}, OriginalByteLength={OriginalByteLength}",
                q,
                bytes.Length);
            bytes = MediaImageConverter.Encode(bytes, MediaUploadEncoding.Webp, q);
            contentType = "image/webp";
            displayName = Path.ChangeExtension(displayName, ".webp");
            _logger.LogDebug(
                "WebP conversion complete. OutputByteLength={OutputByteLength}",
                bytes.Length);
        }

        var id = Guid.NewGuid();
        var publicBase = ResolvePublicBaseUrl(baseUrl);
        var fileUrl = BuildMediaFileUrl(publicBase, id);

        var folder = string.IsNullOrWhiteSpace(request.Folder) ? "library" : request.Folder.Trim();

        var mediaItem = new Domain.Entities.MediaItem
        {
            Id = id,
            Name = displayName,
            Url = fileUrl,
            Thumbnail = fileUrl,
            Type = ResolveMediaType(contentType),
            Size = bytes.Length,
            BrandId = request.BrandId,
            Folder = folder,
            Alt = request.Alt,
            UploadedBy = uploadedBy,
            UploadedAt = DateTime.UtcNow,
            StorageProvider = MediaStorageProvider.Database,
            Content = bytes,
            ContentType = contentType,
        };

        await _mediaRepository.AddAsync(mediaItem, cancellationToken);
        await _mediaRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Media uploaded. MediaId={MediaId}, BrandId={BrandId}, FileName={FileName}, Size={Size}, ContentType={ContentType}, UserId={UserId}",
            mediaItem.Id,
            mediaItem.BrandId,
            request.File.FileName,
            mediaItem.Size,
            mediaItem.ContentType,
            uploadedBy);

        return mediaItem.Adapt<MediaItemDto>();
    }

    public async Task<MediaItemDto> UpdateAsync(
        Guid id,
        UpdateMediaItemRequest request,
        Guid actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        var mediaItem = await _mediaRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Media item not found.");

        await EnsureBrandAccessAsync(actorUserId, mediaItem.BrandId, cancellationToken);

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            mediaItem.Name = request.Name.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Alt))
        {
            mediaItem.Alt = request.Alt.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.Folder))
        {
            mediaItem.Folder = request.Folder.Trim();
        }

        await _mediaRepository.UpdateAsync(mediaItem, cancellationToken);
        await _mediaRepository.SaveChangesAsync(cancellationToken);
        return mediaItem.Adapt<MediaItemDto>();
    }

    public async Task DeleteAsync(Guid id, Guid actorUserId, CancellationToken cancellationToken = default)
    {
        var mediaItem = await _mediaRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Media item not found.");

        await EnsureBrandAccessAsync(actorUserId, mediaItem.BrandId, cancellationToken);
        await _mediaRepository.DeleteAsync(mediaItem, cancellationToken);
        await _mediaRepository.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// JPEG/PNG/WebP/AVIF may be re-encoded to WebP; GIF and SVG are never converted here.
    /// </summary>
    private static bool IsRasterWebpCandidate(string contentType) =>
        contentType.Equals("image/jpeg", StringComparison.OrdinalIgnoreCase)
        || contentType.Equals("image/png", StringComparison.OrdinalIgnoreCase)
        || contentType.Equals("image/webp", StringComparison.OrdinalIgnoreCase)
        || contentType.Equals("image/avif", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Resolves a normalized Content-Type allowed for upload. Uses extension when the client sends no type or application/octet-stream.
    /// </summary>
    private static string ResolveUploadContentType(IFormFile file)
    {
        var declared = file.ContentType?.Trim();
        var ext = Path.GetExtension(file.FileName);

        var isOctetOrEmpty = string.IsNullOrWhiteSpace(declared)
            || declared.Equals("application/octet-stream", StringComparison.OrdinalIgnoreCase);

        if (isOctetOrEmpty)
        {
            if (string.IsNullOrWhiteSpace(ext) || !ExtensionToContentType.TryGetValue(ext, out var inferred))
            {
                throw new InvalidOperationException(
                    "Could not determine file type. Use a supported file extension or a recognized Content-Type.");
            }

            return inferred;
        }

        if (!string.IsNullOrWhiteSpace(declared) && AllowedUploadContentTypes.Contains(declared))
        {
            return declared;
        }

        throw new InvalidOperationException($"Unsupported file type '{declared ?? "(none)"}'.");
    }

    private async Task EnsureBrandAccessAsync(Guid actorUserId, Guid targetBrandId, CancellationToken cancellationToken)
    {
        var allowedBrandIds = await GetAuthorizedBrandIdsAsync(actorUserId, cancellationToken);
        if (!allowedBrandIds.Contains(targetBrandId))
        {
            throw new UnauthorizedAccessException("You are not authorized to manage media for this brand.");
        }
    }

    private async Task<HashSet<Guid>> GetAuthorizedBrandIdsAsync(Guid actorUserId, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(actorUserId.ToString())
            ?? throw new UnauthorizedAccessException("Authenticated user was not found.");

        var roles = await _userManager.GetRolesAsync(user);
        var isAdmin = roles.Any(r => string.Equals(r, nameof(UserRole.Admin), StringComparison.OrdinalIgnoreCase));
        if (isAdmin)
        {
            var brandIds = await _brandRepository.GetAllBrandIdsAsync(cancellationToken);
            return brandIds.ToHashSet();
        }

        return user.BrandIds.ToHashSet();
    }

    private string ResolvePublicBaseUrl(string requestBaseUrl)
    {
        var configured = _mediaOptions.Value.PublicBaseUrl;
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return configured.TrimEnd('/');
        }

        return requestBaseUrl.TrimEnd('/');
    }

    private static string BuildMediaFileUrl(string publicBaseUrl, Guid id)
    {
        return $"{publicBaseUrl}/api/media/{id}/file";
    }

    private static MediaType ResolveMediaType(string? contentType)
    {
        if (string.IsNullOrWhiteSpace(contentType))
        {
            return MediaType.Image;
        }

        if (contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return MediaType.Image;
        }

        if (contentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase))
        {
            return MediaType.Video;
        }

        return MediaType.Document;
    }
}
