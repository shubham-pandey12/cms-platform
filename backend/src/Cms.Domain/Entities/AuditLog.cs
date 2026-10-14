using Cms.Domain.Enums;

namespace Cms.Domain.Entities;

/// <summary>
/// Represents an audit log entry for tracking changes.
/// </summary>
public sealed class AuditLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public AuditEntityType EntityType { get; set; }
    public Guid EntityId { get; set; }

    /// <summary>
    /// Additional details stored as JSON.
    /// </summary>
    public string Details { get; set; } = "{}";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

