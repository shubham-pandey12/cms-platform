using Cms.Application.DTOs.Auth.Requests;
using Cms.Application.DTOs.Auth.Responses;

namespace Cms.Application.Interfaces.Services;

/// <summary>
/// Service interface for authentication operations.
/// </summary>
public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Exchanges an MOS OAuth authorization code for tokens, resolves the user, and returns a CMS auth response.
    /// </summary>
    Task<AuthResponse> LoginWithMosCallbackAsync(MosCallbackRequest request, CancellationToken cancellationToken = default);
    Task<UserDto> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default);
}

