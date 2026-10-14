using FluentValidation;
using Mapster;
using Microsoft.Extensions.Logging;
using Cms.Application.DTOs.Redirects;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Entities;

namespace Cms.Application.Services.Redirects;

/// <summary>
/// Service for brand redirect CRUD and path resolution.
/// </summary>
public sealed class RedirectService : IRedirectService
{
    private const int MaxRedirectTraversalDepth = 32;

    private readonly IRedirectRepository _redirectRepository;
    private readonly IBrandRepository _brandRepository;
    private readonly IValidator<CreateRedirectRequest> _createValidator;
    private readonly IValidator<UpdateRedirectRequest> _updateValidator;
    private readonly ILogger<RedirectService> _logger;

    public RedirectService(
        IRedirectRepository redirectRepository,
        IBrandRepository brandRepository,
        IValidator<CreateRedirectRequest> createValidator,
        IValidator<UpdateRedirectRequest> updateValidator,
        ILogger<RedirectService> logger)
    {
        _redirectRepository = redirectRepository;
        _brandRepository = brandRepository;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<RedirectDto>> ListByBrandAsync(Guid brandId, CancellationToken cancellationToken = default)
    {
        if (!await _brandRepository.ExistsAsync(brandId, cancellationToken))
            throw new KeyNotFoundException("Brand not found.");

        var rows = await _redirectRepository.GetByBrandIdAsync(brandId, cancellationToken);
        return rows.Select(r => r.Adapt<RedirectDto>()).ToList();
    }

    /// <inheritdoc />
    public async Task<RedirectDto?> GetAsync(Guid brandId, Guid id, CancellationToken cancellationToken = default)
    {
        if (!await _brandRepository.ExistsAsync(brandId, cancellationToken))
            throw new KeyNotFoundException("Brand not found.");

        var row = await _redirectRepository.GetByIdAndBrandIdAsync(id, brandId, tracking: false, cancellationToken);
        return row is null ? null : row.Adapt<RedirectDto>();
    }

    /// <inheritdoc />
    public async Task<RedirectDto> CreateAsync(Guid brandId, CreateRedirectRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);

        if (!await _brandRepository.ExistsAsync(brandId, cancellationToken))
            throw new KeyNotFoundException("Brand not found.");

        var fromNormalized = RedirectPathNormalizer.Normalize(request.From);
        _logger.LogDebug(
            "Redirect path normalized for create. RawFrom={RawFrom}, NormalizedFrom={NormalizedFrom}",
            request.From,
            fromNormalized);
        var toTrimmed = request.To.Trim();

        var duplicate = await _redirectRepository.FindByBrandAndFromAsync(brandId, fromNormalized, cancellationToken);
        if (duplicate is not null)
            throw new InvalidOperationException("A redirect for this path already exists.");

        await EnsureNoRedirectLoopAsync(brandId, fromNormalized, request.To, excludedRedirectId: null, cancellationToken);

        var entity = new Redirect
        {
            Id = Guid.NewGuid(),
            BrandId = brandId,
            From = fromNormalized,
            To = toTrimmed,
            Status = request.Status,
            CreatedAt = DateTime.UtcNow,
        };

        await _redirectRepository.AddAsync(entity, cancellationToken);
        await _redirectRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Redirect created. RedirectId={RedirectId}, BrandId={BrandId}, From={From}",
            entity.Id,
            brandId,
            fromNormalized);

        return entity.Adapt<RedirectDto>();
    }

    /// <inheritdoc />
    public async Task<RedirectDto?> UpdateAsync(Guid brandId, Guid id, UpdateRedirectRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        await _updateValidator.ValidateAndThrowAsync(request, cancellationToken);

        if (!await _brandRepository.ExistsAsync(brandId, cancellationToken))
            throw new KeyNotFoundException("Brand not found.");

        var entity = await _redirectRepository.GetByIdAndBrandIdAsync(id, brandId, tracking: true, cancellationToken);
        if (entity is null)
            return null;

        if (request.From is not null)
        {
            var fromNormalized = RedirectPathNormalizer.Normalize(request.From);
            _logger.LogDebug(
                "Redirect path normalized for update. RawFrom={RawFrom}, NormalizedFrom={NormalizedFrom}",
                request.From,
                fromNormalized);
            var other = await _redirectRepository.FindByBrandAndFromAsync(brandId, fromNormalized, cancellationToken);
            if (other is not null && other.Id != entity.Id)
                throw new InvalidOperationException("A redirect for this path already exists.");
            entity.From = fromNormalized;
        }

        if (request.To is not null)
            entity.To = request.To.Trim();

        if (request.Status.HasValue)
            entity.Status = request.Status.Value;

        await EnsureNoRedirectLoopAsync(brandId, entity.From, entity.To, entity.Id, cancellationToken);

        entity.UpdatedAt = DateTime.UtcNow;

        await _redirectRepository.UpdateAsync(entity, cancellationToken);
        await _redirectRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Redirect updated. RedirectId={RedirectId}, BrandId={BrandId}",
            id,
            brandId);

        return entity.Adapt<RedirectDto>();
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(Guid brandId, Guid id, CancellationToken cancellationToken = default)
    {
        if (!await _brandRepository.ExistsAsync(brandId, cancellationToken))
            throw new KeyNotFoundException("Brand not found.");

        var entity = await _redirectRepository.GetByIdAndBrandIdAsync(id, brandId, tracking: true, cancellationToken);
        if (entity is null)
            return false;

        await _redirectRepository.DeleteAsync(entity, cancellationToken);
        await _redirectRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Redirect deleted. RedirectId={RedirectId}, BrandId={BrandId}",
            id,
            brandId);

        return true;
    }

    /// <inheritdoc />
    public async Task<RedirectResolveDto?> ResolveAsync(Guid brandId, string path, CancellationToken cancellationToken = default)
    {
        if (!await _brandRepository.ExistsAsync(brandId, cancellationToken))
            throw new KeyNotFoundException("Brand not found.");

        var normalized = RedirectPathNormalizer.Normalize(path);
        _logger.LogDebug(
            "Resolving redirect. BrandId={BrandId}, RawPath={RawPath}, NormalizedPath={NormalizedPath}",
            brandId,
            path,
            normalized);

        var row = await _redirectRepository.FindByBrandAndFromAsync(brandId, normalized, cancellationToken);
        if (row is null)
            return null;

        return new RedirectResolveDto(row.To, row.Status);
    }

    private async Task EnsureNoRedirectLoopAsync(
        Guid brandId,
        string normalizedFrom,
        string toRaw,
        Guid? excludedRedirectId,
        CancellationToken cancellationToken)
    {
        if (!TryNormalizeInternalTargetPath(toRaw, out var normalizedTarget))
            return;

        if (string.Equals(normalizedFrom, normalizedTarget, StringComparison.Ordinal))
            throw new InvalidOperationException("Redirect would create a loop.");

        var redirects = await _redirectRepository.GetByBrandIdAsync(brandId, cancellationToken);
        var map = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var redirect in redirects)
        {
            if (excludedRedirectId.HasValue && redirect.Id == excludedRedirectId.Value)
                continue;

            if (!TryNormalizeInternalTargetPath(redirect.To, out var existingTarget))
                continue;

            map[redirect.From] = existingTarget;
        }

        map[normalizedFrom] = normalizedTarget;
        var current = normalizedTarget;
        for (var i = 0; i < MaxRedirectTraversalDepth; i++)
        {
            if (string.Equals(current, normalizedFrom, StringComparison.Ordinal))
                throw new InvalidOperationException("Redirect would create a loop.");

            if (!map.TryGetValue(current, out var next))
                return;

            current = next;
        }

        throw new InvalidOperationException("Redirect chain is too deep or cyclic.");
    }

    private static bool TryNormalizeInternalTargetPath(string toRaw, out string normalizedPath)
    {
        normalizedPath = string.Empty;
        if (string.IsNullOrWhiteSpace(toRaw))
            return false;

        var trimmed = toRaw.Trim();
        if (Uri.TryCreate(trimmed, UriKind.Absolute, out _))
            return false;

        normalizedPath = RedirectPathNormalizer.Normalize(trimmed);
        return true;
    }
}
