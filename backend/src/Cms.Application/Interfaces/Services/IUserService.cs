using Cms.Application.DTOs.Users;

namespace Cms.Application.Interfaces.Services;

/// <summary>
/// Service for admin user management (list, get, update).
/// </summary>
public interface IUserService
{
    Task<List<ListUserDto>> ListUsersAsync(CancellationToken cancellationToken = default);
    Task<ListUserDto?> GetUserAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ListUserDto> UpdateUserAsync(Guid id, UpdateUserRequest request, CancellationToken cancellationToken = default);
}
