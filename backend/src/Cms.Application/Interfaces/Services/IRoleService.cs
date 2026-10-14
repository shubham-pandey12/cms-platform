using Cms.Application.DTOs.Rbac;

namespace Cms.Application.Interfaces.Services;

public interface IRoleService
{
    Task<List<RoleDefinitionDto>> ListRolesAsync(CancellationToken cancellationToken = default);
    Task<List<PermissionDefinitionDto>> ListPermissionsAsync(CancellationToken cancellationToken = default);
    Task<RoleDefinitionDto> CreateRoleAsync(CreateRoleRequest request, CancellationToken cancellationToken = default);
    Task<RoleDefinitionDto> UpdateRoleAsync(Guid roleId, UpdateRoleRequest request, CancellationToken cancellationToken = default);
    Task DeleteRoleAsync(Guid roleId, CancellationToken cancellationToken = default);
    Task<RoleDefinitionDto> UpdateRolePermissionsAsync(Guid roleId, UpdateRolePermissionsRequest request, CancellationToken cancellationToken = default);
}

