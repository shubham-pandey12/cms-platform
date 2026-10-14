using Cms.Application.DTOs.Redirects;

namespace Cms.Application.Interfaces.Services;

/// <summary>
/// Application service for brand-scoped URL redirects.
/// </summary>
public interface IRedirectService
{
    Task<IReadOnlyList<RedirectDto>> ListByBrandAsync(Guid brandId, CancellationToken cancellationToken = default);

    Task<RedirectDto?> GetAsync(Guid brandId, Guid id, CancellationToken cancellationToken = default);

    Task<RedirectDto> CreateAsync(Guid brandId, CreateRedirectRequest request, CancellationToken cancellationToken = default);

    Task<RedirectDto?> UpdateAsync(Guid brandId, Guid id, UpdateRedirectRequest request, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid brandId, Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns a redirect target when the normalized path matches a rule; otherwise null.
    /// </summary>
    Task<RedirectResolveDto?> ResolveAsync(Guid brandId, string path, CancellationToken cancellationToken = default);
}
