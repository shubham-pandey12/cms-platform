using Cms.Domain.Enums;

namespace Cms.Domain.Entities;

/// <summary>
/// Assigns a role to a user for an organization or brand scope.
/// </summary>
public sealed class UserRoleAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public Guid RoleDefinitionId { get; set; }
    public RoleDefinition RoleDefinition { get; set; } = null!;
    public AssignmentScopeType ScopeType { get; set; } = AssignmentScopeType.Organization;
    public Guid? ScopeId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

