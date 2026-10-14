using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Cms.Application.Common.Security;
using Cms.Application.Common.Interfaces;
using Cms.Application.DTOs.Auth.Requests;
using Cms.Application.DTOs.Auth.Responses;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;
using Cms.Application.DTOs.Mos;
using Cms.Application.Options;
using Cms.Domain.Entities;
using Cms.Domain.Enums;

namespace Cms.Application.Services.Auth;

/// <summary>
/// Service for authentication operations.
/// </summary>
public sealed class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IJwtService _jwtService;
    private readonly IBrandRepository _brandRepository;
    private readonly IRbacRepository _rbacRepository;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly MosGatewayOptions _mosOptions;
    private readonly ILogger<AuthService> _logger;
    private readonly IPermissionResolver _permissionResolver;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IJwtService jwtService,
        IPermissionResolver permissionResolver,
        IBrandRepository brandRepository,
        IRbacRepository rbacRepository,
        IHttpClientFactory httpClientFactory,
        IOptions<MosGatewayOptions> mosOptions,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtService = jwtService;
        _permissionResolver = permissionResolver;
        _brandRepository = brandRepository;
        _rbacRepository = rbacRepository;
        _httpClientFactory = httpClientFactory;
        _mosOptions = mosOptions.Value;
        _logger = logger;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            _logger.LogWarning("Login failed: user not found. Email={Email}", request.Email);
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false);
        if (!result.Succeeded)
        {
            _logger.LogWarning("Login failed: invalid credentials. UserId={UserId}, Email={Email}", user.Id, request.Email);
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        var roles = await _userManager.GetRolesAsync(user);
        await EnsureRbacAssignmentsForUserAsync(user, roles, cancellationToken);
        var token = _jwtService.GenerateToken(user, roles);
        var refreshToken = _jwtService.GenerateRefreshToken();
        var brandIds = await GetUserBrandIdsAsync(user, roles, cancellationToken);
        var primaryRole = roles.FirstOrDefault() ?? string.Empty;
        var effectivePermissions = await _permissionResolver.GetEffectivePermissionsAsync(user.Id, cancellationToken);

        _logger.LogInformation("Login succeeded. UserId={UserId}, Email={Email}", user.Id, user.Email);

        return new AuthResponse(
            Token: token,
            RefreshToken: refreshToken,
            ExpiresAt: _jwtService.GetTokenExpiry(),
            User: new UserDto(
                Id: user.Id,
                Email: user.Email ?? string.Empty,
                Name: user.Name,
                Role: primaryRole,
                BrandIds: brandIds,
                Roles: roles.ToList(),
                EffectivePermissions: effectivePermissions));
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            throw new InvalidOperationException("User with this email already exists");
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            Name = request.Name,
            BrandIds = [],
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException($"Registration failed: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }

        await _userManager.AddToRoleAsync(user, UserRole.ContentTeam.ToString());
        var roles = await _userManager.GetRolesAsync(user);
        await EnsureRbacAssignmentsForUserAsync(user, roles, cancellationToken);

        var token = _jwtService.GenerateToken(user, roles);
        var refreshToken = _jwtService.GenerateRefreshToken();
        var brandIds = await GetUserBrandIdsAsync(user, roles, cancellationToken);
        var primaryRole = roles.FirstOrDefault() ?? string.Empty;
        var effectivePermissions = await _permissionResolver.GetEffectivePermissionsAsync(user.Id, cancellationToken);

        _logger.LogInformation("User registered. UserId={UserId}, Email={Email}", user.Id, user.Email);

        return new AuthResponse(
            Token: token,
            RefreshToken: refreshToken,
            ExpiresAt: _jwtService.GetTokenExpiry(),
            User: new UserDto(
                Id: user.Id,
                Email: user.Email ?? string.Empty,
                Name: user.Name,
                Role: primaryRole,
                BrandIds: brandIds,
                Roles: roles.ToList(),
                EffectivePermissions: effectivePermissions));
    }

    public async Task<AuthResponse> LoginWithMosCallbackAsync(MosCallbackRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var authCode = request.Code;
        if (string.IsNullOrWhiteSpace(authCode))
        {
            _logger.LogWarning("SSO mos-callback rejected: authorization code missing or empty.");
            throw new UnauthorizedAccessException("Authorization code is required");
        }

        var codeLength = authCode.Length;
        var normalizedRedirectUri = request.RedirectUri.TrimEnd('/');
        _logger.LogInformation(
            "SSO mos-callback started. RedirectUri={RedirectUri}, AuthCodeLength={AuthCodeLength}, AllowedRedirectCount={AllowedRedirectCount}, MosGatewayBaseHost={MosGatewayBaseHost}",
            normalizedRedirectUri,
            codeLength,
            _mosOptions.AllowedRedirectUris.Count,
            SafeHostFromUrl(_mosOptions.BaseUrl));

        if (_mosOptions.AllowedRedirectUris.Count == 0 ||
            !_mosOptions.AllowedRedirectUris.Any(u => string.Equals(u.TrimEnd('/'), normalizedRedirectUri, StringComparison.OrdinalIgnoreCase)))
        {
            _logger.LogWarning(
                "SSO rejected: redirect URI not allowed. NormalizedRedirectUri={NormalizedRedirectUri}, AllowedUris={AllowedUris}",
                normalizedRedirectUri,
                string.Join(", ", _mosOptions.AllowedRedirectUris));
            throw new UnauthorizedAccessException("Invalid redirect URI");
        }

        var tokenResponse = await ExchangeCodeForTokensAsync(authCode, normalizedRedirectUri, cancellationToken);

        string? email = null;
        string name = string.Empty;

        var userInfoPath = _mosOptions.UserInfoPath?.Trim();
        if (!string.IsNullOrWhiteSpace(userInfoPath))
        {
            var whoamiResult = await GetUserInfoFromWhoamiAsync(tokenResponse.AccessToken, cancellationToken);
            if (!string.IsNullOrWhiteSpace(whoamiResult.Email))
            {
                email = whoamiResult.Email;
                name = whoamiResult.Name ?? string.Empty;
                _logger.LogInformation("SSO identity resolved via whoami endpoint.");
            }
            else
            {
                _logger.LogInformation("SSO whoami did not return email; falling back to id_token claims.");
            }
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            var idTokenResult = GetUserInfoFromIdToken(tokenResponse.IdToken);
            email = idTokenResult.Email;
            name = idTokenResult.Name ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(email))
            {
                _logger.LogInformation("SSO identity resolved from id_token.");
            }
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            _logger.LogWarning("SSO failed: could not obtain user email from whoami or id_token.");
            throw new UnauthorizedAccessException("Could not obtain user identity from MOS");
        }

        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
        {
            _logger.LogInformation("SSO provisioning new user for email domain {EmailDomain}.", EmailDomainOnly(email));
            user = await CreateUserFromMosAsync(email, name, cancellationToken);
        }
        else
        {
            _logger.LogInformation("SSO existing user sign-in. UserId={UserId}", user.Id);
        }

        var roles = await _userManager.GetRolesAsync(user);
        await EnsureRbacAssignmentsForUserAsync(user, roles, cancellationToken);
        var token = _jwtService.GenerateToken(user, roles);
        var refreshToken = _jwtService.GenerateRefreshToken();
        var brandIds = await GetUserBrandIdsAsync(user, roles, cancellationToken);
        var primaryRole = roles.FirstOrDefault() ?? string.Empty;
        var effectivePermissions = await _permissionResolver.GetEffectivePermissionsAsync(user.Id, cancellationToken);

        _logger.LogInformation(
            "SSO mos-callback completed successfully. UserId={UserId}, Role={PrimaryRole}",
            user.Id,
            primaryRole);

        return new AuthResponse(
            Token: token,
            RefreshToken: refreshToken,
            ExpiresAt: _jwtService.GetTokenExpiry(),
            User: new UserDto(
                Id: user.Id,
                Email: user.Email ?? string.Empty,
                Name: user.Name,
                Role: primaryRole,
                BrandIds: brandIds,
                Roles: roles.ToList(),
                EffectivePermissions: effectivePermissions));
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            throw new KeyNotFoundException("User not found");
        }

        var roles = await _userManager.GetRolesAsync(user);
        await EnsureRbacAssignmentsForUserAsync(user, roles, cancellationToken);
        var brandIds = await GetUserBrandIdsAsync(user, roles, cancellationToken);
        var primaryRole = roles.FirstOrDefault() ?? string.Empty;
        var effectivePermissions = await _permissionResolver.GetEffectivePermissionsAsync(user.Id, cancellationToken);

        return new UserDto(
            Id: user.Id,
            Email: user.Email ?? string.Empty,
            Name: user.Name,
            Role: primaryRole,
            BrandIds: brandIds,
            Roles: roles.ToList(),
            EffectivePermissions: effectivePermissions);
    }

    private async Task EnsureRbacAssignmentsForUserAsync(
        ApplicationUser user,
        IList<string> identityRoles,
        CancellationToken cancellationToken)
    {
        var assignments = await _rbacRepository.GetUserAssignmentsAsync(user.Id, cancellationToken);
        if (assignments.Count > 0)
        {
            return;
        }

        var roleDefinitions = await _rbacRepository.GetRolesWithPermissionsAsync(cancellationToken);
        var rolesByKey = roleDefinitions.ToDictionary(x => x.Key, StringComparer.OrdinalIgnoreCase);

        var mappedAssignments = new List<UserRoleAssignment>();
        foreach (var identityRole in identityRoles)
        {
            var key = identityRole switch
            {
                nameof(UserRole.Admin) => RoleCatalog.Admin,
                nameof(UserRole.ContentTeam) => RoleCatalog.ContentTeam,
                nameof(UserRole.Engineer) => RoleCatalog.Engineer,
                _ => string.Empty
            };

            if (string.IsNullOrWhiteSpace(key) || !rolesByKey.TryGetValue(key, out var roleDefinition))
            {
                continue;
            }

            mappedAssignments.Add(new UserRoleAssignment
            {
                UserId = user.Id,
                RoleDefinitionId = roleDefinition.Id,
                ScopeType = AssignmentScopeType.Organization
            });
        }

        if (mappedAssignments.Count == 0)
        {
            return;
        }

        await _rbacRepository.ReplaceUserAssignmentsAsync(user.Id, mappedAssignments, cancellationToken);
        await _rbacRepository.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Gets the brand IDs for a user. Admin users get access to all brands.
    /// </summary>
    private async Task<List<Guid>> GetUserBrandIdsAsync(
        ApplicationUser user,
        IEnumerable<string> roles,
        CancellationToken cancellationToken = default)
    {
        var isAdmin = roles.Any(r =>
            string.Equals(r, UserRole.Admin.ToString(), StringComparison.OrdinalIgnoreCase));

        if (isAdmin)
        {
            return await _brandRepository.GetAllBrandIdsAsync(cancellationToken);
        }

        return user.BrandIds;
    }

    private async Task<MosTokenResponse> ExchangeCodeForTokensAsync(string code, string redirectUri, CancellationToken cancellationToken)
    {
        var baseUrl = _mosOptions.BaseUrl.TrimEnd('/');
        var tokenUrl = $"{baseUrl}/oauth/token";
        var tokenHost = SafeHostFromUrl(tokenUrl);
        var form = new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["client_id"] = _mosOptions.ClientId,
            ["client_secret"] = _mosOptions.ClientSecret,
            ["code"] = code,
            ["redirect_uri"] = redirectUri
        };
        var content = new FormUrlEncodedContent(form);

        using var client = _httpClientFactory.CreateClient(nameof(AuthService));
        client.Timeout = TimeSpan.FromSeconds(_mosOptions.TimeoutSeconds);
        var request = new HttpRequestMessage(HttpMethod.Post, tokenUrl) { Content = content };
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        _logger.LogInformation(
            "sso_token_exchange_start UrlHost={UrlHost}, TimeoutSeconds={TimeoutSeconds}, RedirectUri={RedirectUri}, ClientId={ClientId}, CodeLength={CodeLength}",
            tokenHost,
            _mosOptions.TimeoutSeconds,
            redirectUri,
            _mosOptions.ClientId,
            (code ?? string.Empty).Length);

        var stopwatch = Stopwatch.StartNew();
        HttpResponseMessage response;
        try
        {
            response = await client.SendAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(
                ex,
                "sso_token_exchange_exception UrlHost={UrlHost}, TimeoutSeconds={TimeoutSeconds}, ElapsedMs={ElapsedMs}, ExceptionType={ExceptionType}, InnerExceptionType={InnerExceptionType}, CancellationRequested={CancellationRequested}",
                tokenHost,
                _mosOptions.TimeoutSeconds,
                stopwatch.ElapsedMilliseconds,
                ex.GetType().FullName ?? string.Empty,
                ex.InnerException?.GetType().FullName ?? string.Empty,
                cancellationToken.IsCancellationRequested);
            throw;
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        stopwatch.Stop();

        _logger.LogInformation(
            "sso_token_exchange_response UrlHost={UrlHost}, TimeoutSeconds={TimeoutSeconds}, StatusCode={StatusCode}, ElapsedMs={ElapsedMs}",
            tokenHost,
            _mosOptions.TimeoutSeconds,
            (int)response.StatusCode,
            stopwatch.ElapsedMilliseconds);

        if (!response.IsSuccessStatusCode)
        {
            var preview = body.Length > 400 ? body[..400] + "…" : body;
            _logger.LogWarning(
                "SSO token exchange failed. StatusCode={StatusCode}, BodyPreview={BodyPreview}",
                (int)response.StatusCode,
                preview);
            throw new UnauthorizedAccessException("Failed to exchange authorization code for tokens");
        }

        var json = JsonDocument.Parse(body);
        var root = json.RootElement;
        var accessToken = root.TryGetProperty("access_token", out var at) ? at.GetString() : null;
        var idToken = root.TryGetProperty("id_token", out var it) ? it.GetString() : null;

        if (string.IsNullOrEmpty(accessToken) || string.IsNullOrEmpty(idToken))
        {
            _logger.LogWarning("SSO token response missing access_token or id_token.");
            throw new UnauthorizedAccessException("Invalid token response from MOS Gateway");
        }

        _logger.LogInformation("SSO token exchange succeeded.");
        return new MosTokenResponse(accessToken, idToken);
    }

    private async Task<(string? Email, string? Name)> GetUserInfoFromWhoamiAsync(string accessToken, CancellationToken cancellationToken)
    {
        var baseUrl = _mosOptions.BaseUrl.TrimEnd('/');
        var path = _mosOptions.UserInfoPath?.Trim().TrimStart('/');
        if (string.IsNullOrEmpty(path))
        {
            return (null, null);
        }

        var whoamiUrl = $"{baseUrl}/{path}";
        var whoamiHost = SafeHostFromUrl(whoamiUrl);

        using var client = _httpClientFactory.CreateClient(nameof(AuthService));
        client.Timeout = TimeSpan.FromSeconds(_mosOptions.TimeoutSeconds);
        var request = new HttpRequestMessage(HttpMethod.Get, whoamiUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        _logger.LogInformation(
            "sso_whoami_start UrlHost={UrlHost}, TimeoutSeconds={TimeoutSeconds}, UserInfoPath={UserInfoPath}",
            whoamiHost,
            _mosOptions.TimeoutSeconds,
            path);

        HttpResponseMessage response;
        var stopwatch = Stopwatch.StartNew();
        try
        {
            response = await client.SendAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogWarning(
                ex,
                "sso_whoami_exception UrlHost={UrlHost}, TimeoutSeconds={TimeoutSeconds}, ElapsedMs={ElapsedMs}, ExceptionType={ExceptionType}, InnerExceptionType={InnerExceptionType}, CancellationRequested={CancellationRequested}",
                whoamiHost,
                _mosOptions.TimeoutSeconds,
                stopwatch.ElapsedMilliseconds,
                ex.GetType().FullName ?? string.Empty,
                ex.InnerException?.GetType().FullName ?? string.Empty,
                cancellationToken.IsCancellationRequested);
            return (null, null);
        }

        stopwatch.Stop();
        _logger.LogInformation(
            "sso_whoami_response UrlHost={UrlHost}, TimeoutSeconds={TimeoutSeconds}, StatusCode={StatusCode}, ElapsedMs={ElapsedMs}",
            whoamiHost,
            _mosOptions.TimeoutSeconds,
            (int)response.StatusCode,
            stopwatch.ElapsedMilliseconds);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogInformation(
                "SSO whoami non-success. StatusCode={StatusCode}, UrlHost={WhoamiHost}",
                (int)response.StatusCode,
                SafeHostFromUrl(whoamiUrl));
            return (null, null);
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        MosWhoamiDto? dto;
        try
        {
            dto = JsonSerializer.Deserialize<MosWhoamiDto>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch
        {
            return (null, null);
        }

        var staff = dto?.Identity?.MosStaffMember;
        if (staff == null || string.IsNullOrWhiteSpace(staff.Email))
        {
            return (null, null);
        }

        var nameParts = new[] { staff.FirstName?.Trim(), staff.LastName?.Trim() }.Where(s => !string.IsNullOrEmpty(s));
        var name = string.Join(" ", nameParts).Trim();
        return (staff.Email.Trim(), string.IsNullOrEmpty(name) ? null : name);
    }

    private static (string? Email, string Name) GetUserInfoFromIdToken(string idToken)
    {
        var handler = new JwtSecurityTokenHandler();
        if (!handler.CanReadToken(idToken))
        {
            return (null, string.Empty);
        }

        var jwt = handler.ReadJwtToken(idToken);
        var email = jwt.Claims.FirstOrDefault(c => c.Type == "email")?.Value
            ?? jwt.Claims.FirstOrDefault(c => c.Type == "preferred_username")?.Value
            ?? jwt.Subject;
        var name = jwt.Claims.FirstOrDefault(c => c.Type == "name")?.Value
            ?? jwt.Claims.FirstOrDefault(c => c.Type == "given_name")?.Value
            ?? string.Empty;

        return (email, name ?? string.Empty);
    }

    private async Task<ApplicationUser> CreateUserFromMosAsync(string email, string name, CancellationToken cancellationToken)
    {
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            Name = string.IsNullOrWhiteSpace(name) ? email : name,
            BrandIds = [],
            CreatedAt = DateTime.UtcNow
        };

        var password = Convert.ToBase64String(Guid.NewGuid().ToByteArray()) + "aA1!";
        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException($"Could not create user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }

        await _userManager.AddToRoleAsync(user, UserRole.ContentTeam.ToString());
        return user;
    }

    private sealed record MosTokenResponse(string AccessToken, string IdToken);

    private static string SafeHostFromUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return string.Empty;
        }

        try
        {
            return new Uri(url, UriKind.Absolute).Host;
        }
        catch
        {
            return "invalid_url";
        }
    }

    private static string EmailDomainOnly(string email)
    {
        var at = email.IndexOf('@');
        return at > 0 && at < email.Length - 1 ? email[(at + 1)..] : "(unknown)";
    }
}

