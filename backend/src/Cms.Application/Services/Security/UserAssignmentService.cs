using Microsoft.AspNetCore.Identity;
using Cms.Application.Common.Interfaces;
using Cms.Application.Common.Security;
using Cms.Application.DTOs.Rbac;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Entities;
using Cms.Domain.Enums;

namespace Cms.Application.Services.Security;

public sealed class UserAssignmentService : IUserAssignmentService
{
    private readonly IRbacRepository _rbacRepository;
    private readonly IPermissionResolver _permissionResolver;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICurrentUser _currentUser;

    public UserAssignmentService(
        IRbacRepository rbacRepository,
        IPermissionResolver permissionResolver,
        UserManager<ApplicationUser> userManager,
        ICurrentUser currentUser)
    {
        _rbacRepository = rbacRepository;
        _permissionResolver = permissionResolver;
        _userManager = userManager;
        _currentUser = currentUser;
    }

    public async Task<UserAssignmentsResponseDto> GetUserAssignmentsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        var assignments = await _rbacRepository.GetUserAssignmentsAsync(userId, cancellationToken);
        var effective = await _permissionResolver.GetEffectivePermissionsAsync(userId, cancellationToken);
        return new UserAssignmentsResponseDto(userId, assignments.Select(MapAssignment).ToList(), effective);
    }

    public async Task<UserAssignmentsResponseDto> UpdateUserAssignmentsAsync(Guid userId, UpdateUserAssignmentsRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        var callerId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException("Caller identity is required to update assignments.");

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        var assignmentsList = request.Assignments ?? [];
        if (assignmentsList.Count == 0)
        {
            if (!await _permissionResolver.HasPermissionAsync(
                    callerId,
                    PermissionCatalog.UsersManage,
                    brandId: null,
                    cancellationToken))
            {
                throw new UnauthorizedAccessException(
                    "Organization-level user management permission is required to clear all assignments.");
            }
        }

        foreach (var input in assignmentsList)
        {
            if (input.ScopeType == AssignmentScopeType.Organization)
            {
                if (!await _permissionResolver.HasPermissionAsync(
                        callerId,
                        PermissionCatalog.UsersManage,
                        brandId: null,
                        cancellationToken))
                {
                    throw new UnauthorizedAccessException(
                        "Organization-level user management permission is required for organization-scoped assignments.");
                }
            }
            else
            {
                if (!input.ScopeId.HasValue)
                {
                    throw new ArgumentException("Brand-scoped assignment requires scopeId.", nameof(request));
                }

                if (!await _permissionResolver.HasPermissionAsync(
                        callerId,
                        PermissionCatalog.UsersManage,
                        input.ScopeId.Value,
                        cancellationToken))
                {
                    throw new UnauthorizedAccessException(
                        "User management permission for the target brand is required for brand-scoped assignments.");
                }
            }
        }

        var roles = await _rbacRepository.GetRolesWithPermissionsAsync(cancellationToken);
        var rolesById = roles.ToDictionary(x => x.Id);

        foreach (var input in request.Assignments ?? [])
        {
            if (!rolesById.ContainsKey(input.RoleDefinitionId))
            {
                throw new ArgumentException($"Role '{input.RoleDefinitionId}' was not found.", nameof(request));
            }

            if (input.ScopeType == AssignmentScopeType.Brand)
            {
                if (!input.ScopeId.HasValue)
                {
                    throw new ArgumentException("Brand-scoped assignment requires scopeId.", nameof(request));
                }

                var brandExists = await _rbacRepository.BrandExistsAsync(input.ScopeId.Value, cancellationToken);
                if (!brandExists)
                {
                    throw new ArgumentException($"Brand scope '{input.ScopeId.Value}' does not exist.", nameof(request));
                }
            }

            if (input.ScopeType == AssignmentScopeType.Organization && input.ScopeId.HasValue)
            {
                throw new ArgumentException("Organization-scoped assignments cannot specify scopeId.", nameof(request));
            }
        }

        var mappedAssignments = (request.Assignments ?? [])
            .Select(x => new UserRoleAssignment
            {
                UserId = userId,
                RoleDefinitionId = x.RoleDefinitionId,
                ScopeType = x.ScopeType,
                ScopeId = x.ScopeId
            })
            .ToList();

        var adminRoleId = roles.FirstOrDefault(x => x.Key == RoleCatalog.Admin)?.Id;
        if (adminRoleId.HasValue)
        {
            var hasOrgAdminInRequest = mappedAssignments.Any(x =>
                x.RoleDefinitionId == adminRoleId.Value
                && x.ScopeType == AssignmentScopeType.Organization
                && x.ScopeId == null);

            if (!hasOrgAdminInRequest)
            {
                var hasOtherAdmin = await _rbacRepository.HasOrganizationAdminAsync(userId, cancellationToken);
                if (!hasOtherAdmin)
                {
                    throw new InvalidOperationException("Cannot remove the last organization admin assignment.");
                }
            }
        }

        await _rbacRepository.ReplaceUserAssignmentsAsync(userId, mappedAssignments, cancellationToken);
        await _rbacRepository.SaveChangesAsync(cancellationToken);

        return await GetUserAssignmentsAsync(userId, cancellationToken);
    }

    private static UserRoleAssignmentDto MapAssignment(UserRoleAssignment assignment)
    {
        return new UserRoleAssignmentDto(
            assignment.Id,
            assignment.UserId,
            assignment.RoleDefinitionId,
            assignment.RoleDefinition.Key,
            assignment.RoleDefinition.Name,
            assignment.ScopeType,
            assignment.ScopeId);
    }
}

