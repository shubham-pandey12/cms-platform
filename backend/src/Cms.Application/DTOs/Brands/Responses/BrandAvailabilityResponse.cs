namespace Cms.Application.DTOs.Brands.Responses;

/// <summary>
/// Result of checking whether domain and subdomain are available for a brand (create or edit).
/// </summary>
public sealed record BrandAvailabilityResponse(bool DomainAvailable, bool SubdomainAvailable);
