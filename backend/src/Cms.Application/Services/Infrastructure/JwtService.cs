using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Cms.Application.Common.Interfaces;
using Cms.Domain.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Cms.Application.Services.Infrastructure;

/// <summary>
/// JWT token generation service.
/// </summary>
public sealed class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<JwtService> _logger;

    public JwtService(IConfiguration configuration, ILogger<JwtService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Generates a JWT token for the specified user with Identity roles.
    /// </summary>
    public string GenerateToken(ApplicationUser user, IEnumerable<string> roles)
    {
        var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
        var issuer = _configuration["Jwt:Issuer"] ?? "Cms";
        var audience = _configuration["Jwt:Audience"] ?? "CmsUsers";
        if (!int.TryParse(_configuration["Jwt:ExpirationMinutes"], out var expirationMinutes) || expirationMinutes <= 0)
        {
            expirationMinutes = 60;
        }
        var tokenVersion = _configuration["Jwt:TokenVersion"] ?? "1";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var roleList = roles?.ToList() ?? new List<string>();

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new("token_version", tokenVersion),
        };

        foreach (var role in roleList)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials);

        _logger.LogDebug(
            "JWT access token issued. UserId={UserId}, ExpirationMinutes={ExpirationMinutes}",
            user.Id,
            expirationMinutes);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <inheritdoc />
    public DateTime GetTokenExpiry()
    {
        if (!int.TryParse(_configuration["Jwt:ExpirationMinutes"], out var minutes) || minutes <= 0)
        {
            minutes = 60;
        }
        return DateTime.UtcNow.AddMinutes(minutes);
    }

    /// <summary>
    /// Generates a refresh token.
    /// </summary>
    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}
