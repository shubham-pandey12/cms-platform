namespace Cms.Domain.Entities;

/// <summary>
/// Many-to-many join between role and permission.
/// </summary>
public sealed class RolePermission
{
    public Guid RoleDefinitionId { get; set; }
    public RoleDefinition RoleDefinition { get; set; } = null!;

    public Guid PermissionDefinitionId { get; set; }
    public PermissionDefinition PermissionDefinition { get; set; } = null!;
}

