using Cms.Domain.Enums;

namespace Cms.Application.DTOs.Rbac;

public sealed record UserRoleAssignmentDto(
    Guid Id,
    Guid UserId,
    Guid RoleDefinitionId,
    string RoleKey,
    string RoleName,
    AssignmentScopeType ScopeType,
    Guid? ScopeId);

public sealed record BrandPermissionSetDto(
    Guid BrandId,
    List<string> PermissionKeys);

public sealed record EffectivePermissionsDto(
    List<string> OrganizationPermissionKeys,
    List<BrandPermissionSetDto> BrandPermissionSets);

public sealed record UserAssignmentsResponseDto(
    Guid UserId,
    List<UserRoleAssignmentDto> Assignments,
    EffectivePermissionsDto EffectivePermissions);

public sealed record UserRoleAssignmentInputDto(
    Guid RoleDefinitionId,
    AssignmentScopeType ScopeType,
    Guid? ScopeId);

public sealed record UpdateUserAssignmentsRequest(
    List<UserRoleAssignmentInputDto> Assignments);

