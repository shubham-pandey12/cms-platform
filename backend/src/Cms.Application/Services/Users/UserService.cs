using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Cms.Application.Common.Security;
using Cms.Application.DTOs.Users;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Entities;
using Cms.Domain.Enums;

namespace Cms.Application.Services.Users;

/// <summary>
/// Service for admin user management (list, get, update).
/// </summary>
public sealed class UserService : IUserService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IRbacRepository _rbacRepository;
    private readonly ILogger<UserService> _logger;

    public UserService(UserManager<ApplicationUser> userManager, IRbacRepository rbacRepository, ILogger<UserService> logger)
    {
        _userManager = userManager;
        _rbacRepository = rbacRepository;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<List<ListUserDto>> ListUsersAsync(CancellationToken cancellationToken = default)
    {
        var users = await _userManager.Users.ToListAsync(cancellationToken);
        var assignmentsByUser = await _rbacRepository.GetUsersAssignmentsAsync(
            users.Select(u => u.Id), cancellationToken);

        return users.Select(user =>
        {
            var assignments = assignmentsByUser.TryGetValue(user.Id, out var rows) ? rows : [];
            var role = assignments
                .FirstOrDefault(x => x.ScopeType == AssignmentScopeType.Organization)?
                .RoleDefinition
                .Name ?? string.Empty;
            return new ListUserDto(
                user.Id,
                user.Email ?? string.Empty,
                user.Name,
                role,
                user.BrandIds ?? [],
                user.CreatedAt);
        }).ToList();
    }

    /// <inheritdoc />
    public async Task<ListUserDto?> GetUserAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null)
            return null;
        var assignments = await _rbacRepository.GetUserAssignmentsAsync(user.Id, cancellationToken);
        var role = assignments
            .FirstOrDefault(x => x.ScopeType == AssignmentScopeType.Organization)?
            .RoleDefinition
            .Name ?? string.Empty;
        return new ListUserDto(
            user.Id,
            user.Email ?? string.Empty,
            user.Name,
            role,
            user.BrandIds ?? [],
            user.CreatedAt);
    }

    /// <inheritdoc />
    public async Task<ListUserDto> UpdateUserAsync(Guid id, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null)
            throw new KeyNotFoundException("User not found");

        var roleKey = MapRoleValueToKey(request.Role);
        var roles = await _rbacRepository.GetRolesWithPermissionsAsync(cancellationToken);
        var roleDefinition = roles.FirstOrDefault(x => string.Equals(x.Key, roleKey, StringComparison.OrdinalIgnoreCase))
            ?? throw new ArgumentException("Role is not valid.", nameof(request));

        var existingAssignments = await _rbacRepository.GetUserAssignmentsAsync(id, cancellationToken);
        var isCurrentlyOrgAdmin = existingAssignments.Any(x =>
            x.ScopeType == AssignmentScopeType.Organization &&
            string.Equals(x.RoleDefinition.Key, RoleCatalog.Admin, StringComparison.OrdinalIgnoreCase));

        if (isCurrentlyOrgAdmin && !string.Equals(roleDefinition.Key, RoleCatalog.Admin, StringComparison.OrdinalIgnoreCase))
        {
            var hasOtherAdmin = await _rbacRepository.HasOrganizationAdminAsync(id, cancellationToken);
            if (!hasOtherAdmin)
            {
                throw new InvalidOperationException("Cannot demote the last organization Admin.");
            }
        }

        if (request.Name is { Length: > 0 })
            user.Name = request.Name;

        if (request.BrandIds is not null)
            user.BrandIds = request.BrandIds;

        user.UpdatedAt = DateTime.UtcNow;

        await _userManager.UpdateAsync(user);

        // Preserve brand-scoped rows; only replace the org-level assignment.
        var brandScopedAssignments = existingAssignments
            .Where(x => x.ScopeType == AssignmentScopeType.Brand)
            .Select(x => new UserRoleAssignment
            {
                UserId = id,
                RoleDefinitionId = x.RoleDefinitionId,
                ScopeType = x.ScopeType,
                ScopeId = x.ScopeId
            })
            .ToList();

        brandScopedAssignments.Add(new UserRoleAssignment
        {
            UserId = id,
            RoleDefinitionId = roleDefinition.Id,
            ScopeType = AssignmentScopeType.Organization,
            ScopeId = null
        });

        await _rbacRepository.ReplaceUserAssignmentsAsync(id, brandScopedAssignments, cancellationToken);
        await _rbacRepository.SaveChangesAsync(cancellationToken);

        var updated = await GetUserAsync(id, cancellationToken);
        if (updated is null)
            throw new InvalidOperationException("User not found after update");

        _logger.LogInformation(
            "User updated. UserId={UserId}, Role={Role}, BrandCount={BrandCount}",
            id,
            roleDefinition.Key,
            request.BrandIds?.Count ?? 0);

        return updated;
    }

    private static string MapRoleValueToKey(string roleValue)
    {
        if (string.Equals(roleValue, nameof(UserRole.Admin), StringComparison.OrdinalIgnoreCase))
            return RoleCatalog.Admin;
        if (string.Equals(roleValue, nameof(UserRole.ContentTeam), StringComparison.OrdinalIgnoreCase))
            return RoleCatalog.ContentTeam;
        if (string.Equals(roleValue, nameof(UserRole.Engineer), StringComparison.OrdinalIgnoreCase))
            return RoleCatalog.Engineer;

        var normalized = roleValue.Trim().ToLowerInvariant();
        return normalized switch
        {
            "admin" => RoleCatalog.Admin,
            "contentteam" => RoleCatalog.ContentTeam,
            "content_team" => RoleCatalog.ContentTeam,
            "engineer" => RoleCatalog.Engineer,
            _ => string.Empty
        };
    }
}
