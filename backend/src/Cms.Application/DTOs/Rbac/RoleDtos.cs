namespace Cms.Application.DTOs.Rbac;

public sealed record PermissionDefinitionDto(
    Guid Id,
    string Key,
    string Name,
    string Description,
    bool IsOrganizationLevel);

public sealed record RoleDefinitionDto(
    Guid Id,
    string Key,
    string Name,
    string Description,
    bool IsSystem,
    List<PermissionDefinitionDto> Permissions);

public sealed record CreateRoleRequest(
    string? Key,
    string Name,
    string? Description,
    List<string>? PermissionKeys);

public sealed record UpdateRoleRequest(
    string Name,
    string? Description);

public sealed record UpdateRolePermissionsRequest(
    List<string> PermissionKeys);

