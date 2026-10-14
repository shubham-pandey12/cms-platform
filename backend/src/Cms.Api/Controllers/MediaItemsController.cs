using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cms.Application.Common.Interfaces;
using Cms.Application.Common.Security;
using Cms.Application.DTOs.Media.Requests;
using Cms.Application.DTOs.Media.Responses;
using Cms.Application.Interfaces.Services;

namespace Cms.Api.Controllers;

[ApiController]
[Route("api/media")]
[Authorize]
public sealed class MediaItemsController : ControllerBase
{
    private readonly IMediaService _mediaService;
    private readonly ICurrentUser _currentUser;

    public MediaItemsController(IMediaService mediaService, ICurrentUser currentUser)
    {
        _mediaService = mediaService;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Gets all media items, optionally filtered by brand.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = PolicyCatalog.MediaRead)]
    public async Task<ActionResult<List<MediaItemDto>>> GetAll([FromQuery] Guid? brandId, CancellationToken cancellationToken)
    {
        var mediaItems = await _mediaService.GetAllAsync(brandId, cancellationToken);
        return Ok(mediaItems);
    }

    /// <summary>
    /// Streams binary content for database-stored media. Allows anonymous access so image tags work without sending a JWT.
    /// </summary>
    [HttpGet("{id:guid}/file")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFile(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediaService.GetFileAsync(id, cancellationToken);
        return result switch
        {
            MediaFileResult.Found f => File(f.Content, f.ContentType, enableRangeProcessing: true),
            MediaFileResult.NotFound => NotFound(),
            MediaFileResult.ExternalNotStreamed => NotFound(),
            MediaFileResult.BlobNotImplemented => StatusCode(StatusCodes.Status501NotImplemented),
            _ => NotFound(),
        };
    }

    /// <summary>
    /// Gets a media item by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = PolicyCatalog.MediaRead)]
    public async Task<ActionResult<MediaItemDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var mediaItem = await _mediaService.GetByIdAsync(id, cancellationToken);
        return mediaItem is null ? NotFound() : Ok(mediaItem);
    }

    /// <summary>
    /// Uploads a media item and returns the stored metadata.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = PolicyCatalog.MediaManage)]
    public async Task<ActionResult<MediaItemDto>> Upload([FromForm] UploadMediaRequest request, CancellationToken cancellationToken)
    {
        if (request.File is null || request.File.Length == 0)
        {
            return BadRequest(new { message = "A file is required." });
        }

        if (_currentUser.UserId is null)
        {
            return Unauthorized();
        }

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        try
        {
            var mediaItem = await _mediaService.UploadAsync(request, _currentUser.UserId.Value, baseUrl, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = mediaItem.Id }, mediaItem);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Updates media metadata fields (name, alt, folder).
    /// </summary>
    [HttpPatch("{id:guid}")]
    [Authorize(Policy = PolicyCatalog.MediaManage)]
    public async Task<ActionResult<MediaItemDto>> Update(Guid id, [FromBody] UpdateMediaItemRequest request, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null)
        {
            return Unauthorized();
        }

        try
        {
            var mediaItem = await _mediaService.UpdateAsync(id, request, _currentUser.UserId.Value, cancellationToken);
            return Ok(mediaItem);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Deletes a media item.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = PolicyCatalog.MediaManage)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null)
        {
            return Unauthorized();
        }

        try
        {
            await _mediaService.DeleteAsync(id, _currentUser.UserId.Value, cancellationToken);
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
