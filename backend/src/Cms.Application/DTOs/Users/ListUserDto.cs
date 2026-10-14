namespace Cms.Application.DTOs.Users;

/// <summary>
/// DTO for listing or getting a user in admin user management.
/// </summary>
public sealed record ListUserDto(
    Guid Id,
    string Email,
    string Name,
    string Role,
    List<Guid> BrandIds,
    DateTime CreatedAt);
