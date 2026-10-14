using Cms.Application.DTOs.AuditLogs;
using Cms.Domain.Enums;

namespace Cms.Application.Interfaces.Services;

/// <summary>
/// Service interface for audit log operations (read-only).
/// </summary>
public interface IAuditLogService
{
    Task<List<AuditLogDto>> GetAllAsync(Guid? entityId, AuditEntityType? entityType, int limit, int offset, CancellationToken cancellationToken = default);
}
