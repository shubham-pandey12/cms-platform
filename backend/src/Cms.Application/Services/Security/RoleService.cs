using System.Text.RegularExpressions;
using Cms.Application.Common.Security;
using Cms.Application.DTOs.Rbac;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Entities;

namespace Cms.Application.Services.Security;

public sealed class RoleService : IRoleService
{
    private static readonly Regex KeyFormat = new("^[a-z][a-z0-9_]{0,99}$", RegexOptions.Compiled);

    private static readonly HashSet<string> ReservedRoleKeys =
    [
        RoleCatalog.Admin,
        RoleCatalog.ContentTeam,
        RoleCatalog.Engineer
    ];

    private static readonly string[] AdminMinimumPermissionKeys =
    [
        PermissionCatalog.UsersManage,
        PermissionCatalog.RolesManage
    ];

    private readonly IRbacRepository _rbacRepository;

    public RoleService(IRbacRepository rbacRepository)
    {
        _rbacRepository = rbacRepository;
    }

    public async Task<List<RoleDefinitionDto>> ListRolesAsync(CancellationToken cancellationToken = default)
    {
        var roles = await _rbacRepository.GetRolesWithPermissionsAsync(cancellationToken);
        return roles.Select(MapRole).ToList();
    }

    public async Task<List<PermissionDefinitionDto>> ListPermissionsAsync(CancellationToken cancellationToken = default)
    {
        var permissions = await _rbacRepository.GetAllPermissionsAsync(cancellationToken);
        return permissions
            .OrderBy(x => x.Key, StringComparer.OrdinalIgnoreCase)
            .Select(MapPermission)
            .ToList();
    }

    public async Task<RoleDefinitionDto> CreateRoleAsync(CreateRoleRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required.", nameof(request));

        var key = string.IsNullOrWhiteSpace(request.Key)
            ? SlugifyKey(request.Name)
            : request.Key.Trim().ToLowerInvariant();

        ValidateRoleKey(key);
        if (ReservedRoleKeys.Contains(key))
            throw new ArgumentException("That role key is reserved for system roles.", nameof(request));

        if (await _rbacRepository.GetRoleByKeyAsync(key, cancellationToken) is not null)
            throw new ArgumentException($"A role with key '{key}' already exists.", nameof(request));

        var role = new RoleDefinition
        {
            Key = key,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            IsSystem = false,
            CreatedAt = DateTime.UtcNow
        };

        await using var tx = await _rbacRepository.BeginTransactionAsync(cancellationToken);

        await _rbacRepository.AddRoleAsync(role, cancellationToken);
        await _rbacRepository.SaveChangesAsync(cancellationToken);

        var permissionKeys = request.PermissionKeys ?? [];
        if (permissionKeys.Count > 0)
        {
            await ApplyPermissionsAsync(role.Id, permissionKeys, isAdminRole: false, cancellationToken);
        }

        await tx.CommitAsync(cancellationToken);

        var created = await _rbacRepository.GetRoleWithPermissionsAsync(role.Id, cancellationToken)
            ?? throw new InvalidOperationException("Role not found after create.");
        return MapRole(created);
    }

    public async Task<RoleDefinitionDto> UpdateRoleAsync(Guid roleId, UpdateRoleRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required.", nameof(request));

        var role = await _rbacRepository.GetRoleWithPermissionsAsync(roleId, cancellationToken);
        if (role is null)
            throw new KeyNotFoundException("RBAC role not found.");

        role.Name = request.Name.Trim();
        role.Description = request.Description?.Trim() ?? string.Empty;
        role.UpdatedAt = DateTime.UtcNow;

        await _rbacRepository.SaveChangesAsync(cancellationToken);

        var updated = await _rbacRepository.GetRoleWithPermissionsAsync(roleId, cancellationToken)
            ?? throw new InvalidOperationException("Role not found after update.");
        return MapRole(updated);
    }

    public async Task DeleteRoleAsync(Guid roleId, CancellationToken cancellationToken = default)
    {
        var role = await _rbacRepository.GetRoleWithPermissionsAsync(roleId, cancellationToken);
        if (role is null)
            throw new KeyNotFoundException("RBAC role not found.");

        if (role.IsSystem)
            throw new InvalidOperationException("System roles cannot be deleted.");

        if (await _rbacRepository.RoleHasAssignmentsAsync(roleId, cancellationToken))
            throw new InvalidOperationException("Cannot delete a role that still has user assignments.");

        await _rbacRepository.DeleteRoleAsync(role, cancellationToken);
        await _rbacRepository.SaveChangesAsync(cancellationToken);
    }

    public async Task<RoleDefinitionDto> UpdateRolePermissionsAsync(Guid roleId, UpdateRolePermissionsRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var role = await _rbacRepository.GetRoleWithPermissionsAsync(roleId, cancellationToken);
        if (role is null)
            throw new KeyNotFoundException("RBAC role not found.");

        var isAdminRole = string.Equals(role.Key, RoleCatalog.Admin, StringComparison.OrdinalIgnoreCase);
        await ApplyPermissionsAsync(roleId, request.PermissionKeys ?? [], isAdminRole, cancellationToken);

        var updated = await _rbacRepository.GetRoleWithPermissionsAsync(roleId, cancellationToken)
            ?? throw new InvalidOperationException("Role not found after update.");
        return MapRole(updated);
    }

    private async Task ApplyPermissionsAsync(
        Guid roleId,
        IReadOnlyList<string> permissionKeys,
        bool isAdminRole,
        CancellationToken cancellationToken)
    {
        var normalizedRequested = permissionKeys
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (isAdminRole)
        {
            foreach (var required in AdminMinimumPermissionKeys)
            {
                if (!normalizedRequested.Contains(required, StringComparer.OrdinalIgnoreCase))
                    normalizedRequested.Add(required);
            }
        }

        var permissions = await _rbacRepository.GetPermissionsByKeysAsync(normalizedRequested, cancellationToken);
        if (permissions.Count != normalizedRequested.Count)
        {
            var found = permissions.Select(x => x.Key).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var missing = normalizedRequested.Where(key => !found.Contains(key));
            throw new ArgumentException($"Unknown permission keys: {string.Join(", ", missing)}", nameof(permissionKeys));
        }

        await _rbacRepository.ReplaceRolePermissionsAsync(roleId, permissions.Select(x => x.Id), cancellationToken);
        await _rbacRepository.SaveChangesAsync(cancellationToken);
    }

    private static void ValidateRoleKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key) || !KeyFormat.IsMatch(key))
        {
            throw new ArgumentException(
                "Role key must be 1-100 characters: start with a letter, then lowercase letters, digits, or underscores.",
                nameof(key));
        }
    }

    private static string SlugifyKey(string name)
    {
        var lower = name.Trim().ToLowerInvariant();
        var chars = lower.Select(c =>
        {
            if (char.IsAsciiLetterLower(c) || char.IsAsciiDigit(c))
                return c;
            if (char.IsWhiteSpace(c) || c is '-' or '.')
                return '_';
            return (char?)null;
        }).Where(c => c.HasValue).Select(c => c!.Value).ToArray();

        var raw = new string(chars);
        raw = Regex.Replace(raw, "_+", "_").Trim('_');
        if (raw.Length == 0 || !char.IsAsciiLetter(raw[0]))
            raw = "role_" + Guid.NewGuid().ToString("N")[..8];
        if (raw.Length > 100)
            raw = raw[..100].TrimEnd('_');
        return raw;
    }

    private static RoleDefinitionDto MapRole(RoleDefinition role)
    {
        var permissions = role.RolePermissions
            .Select(x => x.PermissionDefinition)
            .OrderBy(x => x.Key, StringComparer.OrdinalIgnoreCase)
            .Select(MapPermission)
            .ToList();

        return new RoleDefinitionDto(role.Id, role.Key, role.Name, role.Description, role.IsSystem, permissions);
    }

    private static PermissionDefinitionDto MapPermission(PermissionDefinition x) =>
        new(x.Id, x.Key, x.Name, x.Description, x.IsOrganizationLevel);
}
