using Mapster;
using Microsoft.Extensions.Logging;
using Cms.Application.DTOs.AuditLogs;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Enums;

namespace Cms.Application.Services.AuditLogs;

/// <summary>
/// Service for audit log operations.
/// </summary>
public sealed class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(IAuditLogRepository auditLogRepository, ILogger<AuditLogService> logger)
    {
        _auditLogRepository = auditLogRepository;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<List<AuditLogDto>> GetAllAsync(Guid? entityId, AuditEntityType? entityType, int limit, int offset, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug(
            "Audit log query. EntityId={EntityId}, EntityType={EntityType}, Limit={Limit}, Offset={Offset}",
            entityId,
            entityType,
            limit,
            offset);

        var logs = await _auditLogRepository.GetAsync(entityId, entityType, limit, offset, cancellationToken);
        return logs.Select(l => l.Adapt<AuditLogDto>()).ToList();
    }
}
