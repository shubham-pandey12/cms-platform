using Microsoft.EntityFrameworkCore;
using Cms.Application.Common.Security;
using Cms.Application.Interfaces.Repositories;
using Cms.Domain.Entities;
using Cms.Domain.Enums;

namespace Cms.Persistence.Repositories;

public sealed class RbacRepository : IRbacRepository
{
    private readonly CmsDbContext _context;

    public RbacRepository(CmsDbContext context)
    {
        _context = context;
    }

    public Task<List<RoleDefinition>> GetRolesWithPermissionsAsync(CancellationToken cancellationToken = default)
    {
        return _context.RoleDefinitions
            .Include(x => x.RolePermissions)
            .ThenInclude(x => x.PermissionDefinition)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);
    }

    public Task<RoleDefinition?> GetRoleWithPermissionsAsync(Guid roleId, CancellationToken cancellationToken = default)
    {
        return _context.RoleDefinitions
            .Include(x => x.RolePermissions)
            .ThenInclude(x => x.PermissionDefinition)
            .FirstOrDefaultAsync(x => x.Id == roleId, cancellationToken);
    }

    public Task<RoleDefinition?> GetRoleByKeyAsync(string key, CancellationToken cancellationToken = default)
    {
        var normalized = key.Trim().ToLowerInvariant();
        return _context.RoleDefinitions
            .FirstOrDefaultAsync(x => x.Key == normalized, cancellationToken);
    }

    public Task<bool> RoleHasAssignmentsAsync(Guid roleId, CancellationToken cancellationToken = default)
    {
        return _context.UserRoleAssignments.AnyAsync(x => x.RoleDefinitionId == roleId, cancellationToken);
    }

    public async Task AddRoleAsync(RoleDefinition role, CancellationToken cancellationToken = default)
    {
        await _context.RoleDefinitions.AddAsync(role, cancellationToken);
    }

    public Task DeleteRoleAsync(RoleDefinition role, CancellationToken cancellationToken = default)
    {
        _context.RoleDefinitions.Remove(role);
        return Task.CompletedTask;
    }

    public Task<List<PermissionDefinition>> GetPermissionsByKeysAsync(IEnumerable<string> permissionKeys, CancellationToken cancellationToken = default)
    {
        var keys = permissionKeys.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        return _context.PermissionDefinitions
            .Where(x => keys.Contains(x.Key))
            .ToListAsync(cancellationToken);
    }

    public Task<List<PermissionDefinition>> GetAllPermissionsAsync(CancellationToken cancellationToken = default)
    {
        return _context.PermissionDefinitions.OrderBy(x => x.Key).ToListAsync(cancellationToken);
    }

    public async Task ReplaceRolePermissionsAsync(Guid roleId, IEnumerable<Guid> permissionIds, CancellationToken cancellationToken = default)
    {
        var existing = await _context.RolePermissions
            .Where(x => x.RoleDefinitionId == roleId)
            .ToListAsync(cancellationToken);

        _context.RolePermissions.RemoveRange(existing);
        foreach (var permissionId in permissionIds.Distinct())
        {
            _context.RolePermissions.Add(new RolePermission
            {
                RoleDefinitionId = roleId,
                PermissionDefinitionId = permissionId
            });
        }
    }

    public Task<List<UserRoleAssignment>> GetUserAssignmentsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return _context.UserRoleAssignments
            .Include(x => x.RoleDefinition)
            .ThenInclude(x => x.RolePermissions)
            .ThenInclude(x => x.PermissionDefinition)
            .Where(x => x.UserId == userId)
            .ToListAsync(cancellationToken);
    }

    public async Task<Dictionary<Guid, List<UserRoleAssignment>>> GetUsersAssignmentsAsync(
        IEnumerable<Guid> userIds, CancellationToken cancellationToken = default)
    {
        var ids = userIds.Distinct().ToArray();
        var rows = await _context.UserRoleAssignments
            .Include(x => x.RoleDefinition)
            .ThenInclude(x => x.RolePermissions)
            .ThenInclude(x => x.PermissionDefinition)
            .Where(x => ids.Contains(x.UserId))
            .ToListAsync(cancellationToken);

        var result = ids.ToDictionary(id => id, _ => new List<UserRoleAssignment>());
        foreach (var row in rows)
        {
            result[row.UserId].Add(row);
        }
        return result;
    }

    public async Task ReplaceUserAssignmentsAsync(Guid userId, IEnumerable<UserRoleAssignment> assignments, CancellationToken cancellationToken = default)
    {
        var existing = await _context.UserRoleAssignments
            .Where(x => x.UserId == userId)
            .ToListAsync(cancellationToken);

        _context.UserRoleAssignments.RemoveRange(existing);
        foreach (var assignment in assignments)
        {
            assignment.Id = Guid.NewGuid();
            assignment.UserId = userId;
            _context.UserRoleAssignments.Add(assignment);
        }
    }

    public Task<bool> BrandExistsAsync(Guid brandId, CancellationToken cancellationToken = default)
    {
        return _context.Brands.AnyAsync(x => x.Id == brandId, cancellationToken);
    }

    public Task<bool> HasOrganizationAdminAsync(Guid? excludeUserId = null, CancellationToken cancellationToken = default)
    {
        // Use a join instead of Include so EF generates a single EXISTS query, not a full row fetch.
        return _context.UserRoleAssignments
            .AnyAsync(x =>
                x.ScopeType == AssignmentScopeType.Organization &&
                x.RoleDefinition.Key == RoleCatalog.Admin &&
                (!excludeUserId.HasValue || x.UserId != excludeUserId.Value),
                cancellationToken);
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }

    public Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        return _context.Database.BeginTransactionAsync(cancellationToken);
    }
}

