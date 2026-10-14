using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Cms.Application.Common.Interfaces;
using Cms.Application.DTOs.Auth.Requests;
using Cms.Application.DTOs.Auth.Responses;
using Cms.Application.Interfaces.Services;

namespace Cms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    private const string ExternalPingUrl = "https://www.google.com";
    private readonly IAuthService _authService;
    private readonly ICurrentUser _currentUser;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        ICurrentUser currentUser,
        IHttpClientFactory httpClientFactory,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _currentUser = currentUser;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <summary>
    /// Authenticates a user and returns a JWT token.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var response = await _authService.LoginAsync(request, cancellationToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            // Invalid credentials — 401 Unauthorized (caller is not authenticated).
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Registers a new user.
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.RegisterAsync(request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Exchanges an MOS OAuth authorization code for a CMS session (token and user). Call this from the OAuth callback.
    /// </summary>
    [HttpPost("mos-callback")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> MosCallback([FromBody] MosCallbackRequest request, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "HTTP POST api/auth/mos-callback received. RedirectUri={RedirectUri}, AuthCodeLength={AuthCodeLength}",
            request.RedirectUri,
            request.Code?.Length ?? 0);

        try
        {
            var response = await _authService.LoginWithMosCallbackAsync(request, cancellationToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Gets the current authenticated user.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser(CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return Unauthorized();
        }

        var user = await _authService.GetCurrentUserAsync(userId.Value, cancellationToken);
        return Ok(user);
    }

    /// <summary>
    /// Checks if the API can reach an external endpoint over HTTPS.
    /// Useful to diagnose VPC/network egress issues during SSO callbacks.
    /// </summary>
    [HttpGet("ping-external")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> PingExternal(CancellationToken cancellationToken)
    {
        try
        {
            using var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);

            using var response = await client.GetAsync(ExternalPingUrl, cancellationToken);

            return Ok(new
            {
                target = ExternalPingUrl,
                success = response.IsSuccessStatusCode,
                statusCode = (int)response.StatusCode,
                reason = response.ReasonPhrase
            });
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return StatusCode(StatusCodes.Status499ClientClosedRequest, new
            {
                target = ExternalPingUrl,
                success = false,
                error = "Request cancelled by client."
            });
        }
        catch (OperationCanceledException)
        {
            return StatusCode(StatusCodes.Status504GatewayTimeout, new
            {
                target = ExternalPingUrl,
                success = false,
                error = "External ping timed out."
            });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new
            {
                target = ExternalPingUrl,
                success = false,
                error = ex.Message,
                statusCode = ex.StatusCode is null ? (int?)null : (int)ex.StatusCode.Value
            });
        }
    }
}
