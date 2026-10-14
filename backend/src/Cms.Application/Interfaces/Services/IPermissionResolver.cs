using Cms.Application.DTOs.Rbac;

namespace Cms.Application.Interfaces.Services;

public interface IPermissionResolver
{
    Task<EffectivePermissionsDto> GetEffectivePermissionsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> HasPermissionAsync(Guid userId, string permissionKey, Guid? brandId = null, CancellationToken cancellationToken = default);
}

