using Cms.Domain.Entities;

namespace Cms.Application.Interfaces.Repositories;

/// <summary>
/// Repository abstraction for RBAC entities and assignment operations.
/// </summary>
public interface IRbacRepository
{
    Task<List<RoleDefinition>> GetRolesWithPermissionsAsync(CancellationToken cancellationToken = default);
    Task<RoleDefinition?> GetRoleWithPermissionsAsync(Guid roleId, CancellationToken cancellationToken = default);
    Task<RoleDefinition?> GetRoleByKeyAsync(string key, CancellationToken cancellationToken = default);
    Task<bool> RoleHasAssignmentsAsync(Guid roleId, CancellationToken cancellationToken = default);
    Task AddRoleAsync(RoleDefinition role, CancellationToken cancellationToken = default);
    Task DeleteRoleAsync(RoleDefinition role, CancellationToken cancellationToken = default);
    Task<List<PermissionDefinition>> GetPermissionsByKeysAsync(IEnumerable<string> permissionKeys, CancellationToken cancellationToken = default);
    Task<List<PermissionDefinition>> GetAllPermissionsAsync(CancellationToken cancellationToken = default);
    Task ReplaceRolePermissionsAsync(Guid roleId, IEnumerable<Guid> permissionIds, CancellationToken cancellationToken = default);

    Task<List<UserRoleAssignment>> GetUserAssignmentsAsync(Guid userId, CancellationToken cancellationToken = default);
    /// <summary>Loads assignments for multiple users in a single query.</summary>
    Task<Dictionary<Guid, List<UserRoleAssignment>>> GetUsersAssignmentsAsync(IEnumerable<Guid> userIds, CancellationToken cancellationToken = default);
    Task ReplaceUserAssignmentsAsync(Guid userId, IEnumerable<UserRoleAssignment> assignments, CancellationToken cancellationToken = default);

    Task<bool> BrandExistsAsync(Guid brandId, CancellationToken cancellationToken = default);
    Task<bool> HasOrganizationAdminAsync(Guid? excludeUserId = null, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Begins a database transaction. The caller is responsible for committing or rolling back.
    /// </summary>
    Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
}

