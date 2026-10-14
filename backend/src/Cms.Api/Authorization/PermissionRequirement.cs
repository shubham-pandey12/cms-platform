using Microsoft.AspNetCore.Authorization;

namespace Cms.Api.Authorization;

/// <summary>
/// Authorization requirement for a single permission key.
/// </summary>
public sealed class PermissionRequirement : IAuthorizationRequirement
{
    public PermissionRequirement(string permissionKey)
    {
        if (string.IsNullOrWhiteSpace(permissionKey))
            throw new ArgumentException("Permission key must not be empty.", nameof(permissionKey));
        PermissionKey = permissionKey;
    }

    public string PermissionKey { get; }
}

