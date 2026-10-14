using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Cms.Application.Common.Interfaces;
using System.Security.Claims;

namespace Cms.Application.Services.Infrastructure;

/// <summary>
/// Provides access to the current authenticated user from HttpContext.
/// </summary>
public sealed class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<CurrentUser> _logger;

    public CurrentUser(IHttpContextAccessor httpContextAccessor, ILogger<CurrentUser> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public Guid? UserId
    {
        get
        {
            var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return null;
            }

            if (Guid.TryParse(userId, out var id))
            {
                return id;
            }

            _logger.LogWarning("Invalid NameIdentifier claim; expected GUID. Value={Value}", userId);
            return null;
        }
    }

    public string? Email => _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Email);

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;

    public bool IsInRole(string role) => _httpContextAccessor.HttpContext?.User.IsInRole(role) ?? false;
}
