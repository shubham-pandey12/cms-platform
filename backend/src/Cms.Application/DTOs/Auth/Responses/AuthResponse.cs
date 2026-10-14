using Cms.Application.DTOs.Rbac;

namespace Cms.Application.DTOs.Auth.Responses;

public sealed record AuthResponse(
    string Token,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User);

public sealed record UserDto(
    Guid Id,
    string Email,
    string Name,
    string Role,
    List<Guid> BrandIds,
    List<string> Roles,
    EffectivePermissionsDto? EffectivePermissions = null);

