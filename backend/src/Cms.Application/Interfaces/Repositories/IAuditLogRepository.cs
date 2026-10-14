using Cms.Domain.Entities;
using Cms.Domain.Enums;

namespace Cms.Application.Interfaces.Repositories;

/// <summary>
/// Repository interface for AuditLog entity (read-only).
/// </summary>
public interface IAuditLogRepository
{
    Task<List<AuditLog>> GetAsync(Guid? entityId, AuditEntityType? entityType, int limit, int offset, CancellationToken cancellationToken = default);
}
