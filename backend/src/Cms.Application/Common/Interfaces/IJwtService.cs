using Cms.Domain.Entities;

namespace Cms.Application.Common.Interfaces;

/// <summary>
/// Service for generating JWT tokens.
/// </summary>
public interface IJwtService
{
    string GenerateToken(ApplicationUser user, IEnumerable<string> roles);
    string GenerateRefreshToken();

    /// <summary>
    /// Returns the absolute expiry time for a token issued right now, matching the configured
    /// <c>Jwt:ExpirationMinutes</c> value.  Use this to populate <c>AuthResponse.ExpiresAt</c>
    /// instead of hard-coding 60 minutes.
    /// </summary>
    DateTime GetTokenExpiry();
}

