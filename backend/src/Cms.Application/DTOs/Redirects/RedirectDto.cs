using Cms.Domain.Enums;

namespace Cms.Application.DTOs.Redirects;

public sealed record RedirectDto(
    Guid Id,
    string From,
    string To,
    Guid BrandId,
    RedirectStatus Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

/// <summary>
/// Creates a redirect for a brand; brand id comes from the route.
/// </summary>
public sealed record CreateRedirectRequest(
    string From,
    string To,
    RedirectStatus Status);

public sealed record UpdateRedirectRequest(
    string? From,
    string? To,
    RedirectStatus? Status);

/// <summary>
/// Public resolve response for middleware / storefront.
/// </summary>
public sealed record RedirectResolveDto(
    string To,
    RedirectStatus Status);
