using Cms.Application.DTOs.Rbac;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Enums;

namespace Cms.Application.Services.Security;

/// <summary>
/// Resolves effective permissions for organization and brand contexts.
/// Caches results per user for the lifetime of the scoped instance (one HTTP request) to avoid
/// redundant DB round-trips when the handler calls multiple permission checks on the same user.
/// </summary>
public sealed class PermissionResolver : IPermissionResolver
{
    private readonly IRbacRepository _rbacRepository;
    private readonly Dictionary<Guid, EffectivePermissionsDto> _cache = new();

    public PermissionResolver(IRbacRepository rbacRepository)
    {
        _rbacRepository = rbacRepository;
    }

    public async Task<EffectivePermissionsDto> GetEffectivePermissionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(userId, out var cached))
        {
            return cached;
        }

        var assignments = await _rbacRepository.GetUserAssignmentsAsync(userId, cancellationToken);

        var organizationPermissions = assignments
            .Where(x => x.ScopeType == AssignmentScopeType.Organization)
            .SelectMany(x => x.RoleDefinition.RolePermissions.Select(rp => rp.PermissionDefinition.Key))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var brandPermissionSets = assignments
            .Where(x => x.ScopeType == AssignmentScopeType.Brand && x.ScopeId.HasValue)
            .GroupBy(x => x.ScopeId!.Value)
            .Select(group => new BrandPermissionSetDto(
                BrandId: group.Key,
                PermissionKeys: group
                    .SelectMany(x => x.RoleDefinition.RolePermissions.Select(rp => rp.PermissionDefinition.Key))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
                    .ToList()))
            .OrderBy(x => x.BrandId)
            .ToList();

        var result = new EffectivePermissionsDto(organizationPermissions, brandPermissionSets);
        _cache[userId] = result;
        return result;
    }

    public async Task<bool> HasPermissionAsync(Guid userId, string permissionKey, Guid? brandId = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(permissionKey))
        {
            return false;
        }

        var effective = await GetEffectivePermissionsAsync(userId, cancellationToken);

        if (effective.OrganizationPermissionKeys.Contains(permissionKey, StringComparer.OrdinalIgnoreCase))
        {
            return true;
        }

        if (!brandId.HasValue)
        {
            return false;
        }

        var brandPermissions = effective.BrandPermissionSets
            .FirstOrDefault(x => x.BrandId == brandId.Value)?
            .PermissionKeys ?? [];

        return brandPermissions.Contains(permissionKey, StringComparer.OrdinalIgnoreCase);
    }
}

