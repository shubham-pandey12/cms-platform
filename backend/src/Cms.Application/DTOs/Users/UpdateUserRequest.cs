namespace Cms.Application.DTOs.Users;

/// <summary>
/// Request to update a user's name, role, and brand access.
/// </summary>
public sealed record UpdateUserRequest(
    string? Name,
    string Role,
    List<Guid>? BrandIds);
